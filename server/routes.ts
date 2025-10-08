import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { makeUploadKey, uploadBufferToR2, getPresignedGetUrl, makeGeneratedKey, generatedPublicUrlForKey } from "./r2";
import { insertUserSchema, insertPetTransformationSchema, promptTemplateSchema, promptVariantSchema } from "@shared/schema";
import { watermarkAndPreferJpeg } from "./watermark";
import { createBaseballCard, createSuperheroImage, generateBaseballStats, createCustomPromptImage } from "./replicate";
import { enhancePrompt, generatePromptSuggestions, generatePetDescription, generatePersonaStats } from "./openai";

const visitIncrementSchema = z.object({
  transformsDelta: z.number().min(1).max(50).default(5),
  sharesDelta: z.number().min(1).max(200).default(15),
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG files are allowed'));
    }
  },
});

const emailCaptureSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  transformationId: z.string(),
});

const customPromptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  petName: z.string().min(1, "Pet name is required"),
  aspectRatio: z.string().default("1:1"),
  outputFormat: z.string().default("webp"),
});

const promptEnhancementSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  petName: z.string().min(1, "Pet name is required"),
});

const promptSuggestionsSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
  petName: z.string().min(1, "Pet name is required"),
});

const petDescriptionSchema = z.object({
  petName: z.string().min(1, "Pet name is required"),
  traits: z.array(z.string()).default([]),
  breed: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // R2 debug: verify env presence and a quick write
  app.get("/api/r2-debug", (req, res) => {
    const envs = {
      R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_UPLOADS_BUCKET: process.env.R2_UPLOADS_BUCKET || null,
      R2_GENERATED_BUCKET: process.env.R2_GENERATED_BUCKET || null,
      R2_GENERATED_PUBLIC_BASE_URL: process.env.R2_GENERATED_PUBLIC_BASE_URL || null,
    };
    res.json({ success: true, envs });
  });

  app.post("/api/r2-debug", async (req, res) => {
    try {
      const envs = {
        R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
        R2_UPLOADS_BUCKET: process.env.R2_UPLOADS_BUCKET || null,
        R2_GENERATED_BUCKET: process.env.R2_GENERATED_BUCKET || null,
        R2_GENERATED_PUBLIC_BASE_URL: process.env.R2_GENERATED_PUBLIC_BASE_URL || null,
      };

      const hasAll = envs.R2_ACCOUNT_ID && envs.R2_ACCESS_KEY_ID && envs.R2_SECRET_ACCESS_KEY && !!envs.R2_UPLOADS_BUCKET;
      if (!hasAll) {
        return res.status(400).json({ success: false, message: "Missing R2 envs", envs });
      }

      const key = makeUploadKey({ prefix: 'debug', originalName: 'r2-debug.txt' });
      const body = Buffer.from(`r2 debug ${new Date().toISOString()}`);
      await uploadBufferToR2({
        bucket: process.env.R2_UPLOADS_BUCKET as string,
        key,
        body,
        contentType: 'text/plain',
        cacheControl: 'no-store',
      });

      res.json({ success: true, message: 'Wrote debug object to uploads bucket', key });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'R2 debug write failed', error: e?.message || String(e) });
    }
  });

  // Get site-wide metrics
  app.get("/api/stats", async (req, res) => {
    try {
      const metrics = await storage.getSiteMetrics();
      res.json({
        success: true,
        metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to load site metrics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Increment metrics for a visit
  app.post("/api/stats/visit", async (req, res) => {
    try {
      const body = visitIncrementSchema.parse(req.body ?? {});
      const metrics = await storage.incrementSiteMetrics({
        transforms: body.transformsDelta,
        shares: body.sharesDelta,
      });
      res.json({ success: true, metrics });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid metrics payload",
          errors: error.errors,
        });
      }
      res.status(500).json({
        success: false,
        message: "Failed to update site metrics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('petPhoto'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Mock pet detection (in real app, this would use AI)
      const isPetDetected = Math.random() > 0.1; // 90% success rate

      if (!isPetDetected) {
        return res.status(400).json({
          message: "We couldn't detect a pet in this image. Please try another photo."
        });
      }

      const hasR2Config = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_UPLOADS_BUCKET);
      console.log("/api/upload hasR2Config:", hasR2Config, {
        accountId: !!process.env.R2_ACCOUNT_ID,
        accessKey: !!process.env.R2_ACCESS_KEY_ID,
        secretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        uploadsBucket: process.env.R2_UPLOADS_BUCKET,
      });

      if (!hasR2Config) {
        // Fallback to in-memory temp storage if R2 not configured
        const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        (global as any).tempFiles = (global as any).tempFiles || new Map();
        (global as any).tempFiles.set(tempFileId, {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
          uploadedAt: Date.now()
        });

        for (const [id, fileData] of (global as any).tempFiles.entries()) {
          if (Date.now() - fileData.uploadedAt > 3600000) {
            (global as any).tempFiles.delete(id);
          }
        }

        return res.json({
          success: true,
          fileUrl: `temp://${tempFileId}`,
          message: "Pet photo uploaded successfully (temp storage)",
        });
      }

      // Upload directly to R2 uploads bucket and return a presigned GET URL for downstream use
      const key = makeUploadKey({ userId: 'anon', originalName: req.file.originalname });
      console.log("Uploading to R2:", { bucket: process.env.R2_UPLOADS_BUCKET, key, contentType: req.file.mimetype, size: req.file.buffer.length });
      await uploadBufferToR2({
        bucket: process.env.R2_UPLOADS_BUCKET as string,
        key,
        body: req.file.buffer,
        contentType: req.file.mimetype,
        cacheControl: 'private, max-age=0, no-store',
      });
      console.log("Upload to R2 successful:", { bucket: process.env.R2_UPLOADS_BUCKET, key });

      const signedUrl = await getPresignedGetUrl({
        bucket: process.env.R2_UPLOADS_BUCKET as string,
        key,
        expiresInSeconds: 3600,
      });
      console.log("Generated presigned GET URL for upload");

      return res.json({
        success: true,
        fileUrl: signedUrl,
        r2Key: key,
        message: "Pet photo uploaded successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Upload failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create pet transformation
  app.post("/api/transformations", async (req, res) => {
    try {
      const validatedData = insertPetTransformationSchema.parse(req.body);

      // Create transformation record first
      const transformation = await storage.createPetTransformation({
        ...validatedData,
        originalImageUrl: req.body.originalImageUrl || "https://images.unsplash.com/photo-1551717743-49959800b1f6?auto=format&fit=crop&w=500&h=500",
      });

      // Generate AI transformation based on theme
      let transformationResult;

      if (validatedData.theme === 'baseball') {
        // Generate baseball card stats
        const stats = generateBaseballStats(validatedData.petName, (validatedData.traits as string[]) || []);

        transformationResult = await createBaseballCard({
          petImageUrl: transformation.originalImageUrl || "",
          petName: validatedData.petName,
          petBreed: validatedData.petBreed || 'pet',
          gender: validatedData.gender,
          team: "Pet Pantry All-Stars",
          position: "Good Boy/Girl",
          stats: stats,
        });
      } else if (validatedData.theme === 'superhero') {
        transformationResult = await createSuperheroImage({
          petImageUrl: transformation.originalImageUrl || "",
          petName: validatedData.petName,
          petBreed: validatedData.petBreed || 'pet',
          gender: validatedData.gender,
          heroName: `Super ${validatedData.petName}`,
          powers: (validatedData.traits as string[]) || ["loyalty", "cuteness", "treat detection"],
        });
      } else {
        return res.status(400).json({
          message: "Invalid theme. Must be 'baseball' or 'superhero'"
        });
      }

      // Check if AI generation was successful
      if (!transformationResult.success) {
        return res.status(500).json({
          success: false,
          message: "AI image generation failed",
          error: transformationResult.error,
        });
      }

      // Optionally mirror generated image to R2 public bucket
      console.log("Transformation result:", JSON.stringify(transformationResult, null, 2));
      console.log("Image URL type:", typeof transformationResult.imageUrl);
      console.log("Image URL value:", transformationResult.imageUrl);

      // Handle the case where imageUrl might be an object or stream
      let imageUrlToStore = null;
      if (transformationResult.imageUrl) {
        if (typeof transformationResult.imageUrl === 'string') {
          imageUrlToStore = transformationResult.imageUrl;
        } else if (typeof transformationResult.imageUrl === 'object') {
          // Convert URL-like objects to strings (e.g., URL objects from FileOutput)
          const maybeAny: any = transformationResult.imageUrl as any;
          const urlStr = typeof maybeAny === 'string' ? maybeAny : (maybeAny?.toString?.() || String(maybeAny));
          // Only store the converted URL if it looks like a valid HTTP(S) URL
          if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
            imageUrlToStore = urlStr;
            console.log("Converted URL object to string:", urlStr);
          } else {
            imageUrlToStore = 'ai-generated-placeholder-url';
            console.log("Could not convert URL object to valid HTTP URL, using placeholder:", transformationResult.imageUrl);
          }
        } else {
          imageUrlToStore = String(transformationResult.imageUrl);
        }
      }

      // If we have a usable image URL, fetch, watermark with logo, convert to JPEG, and upload to the public R2 generated bucket
      try {
        if (imageUrlToStore && typeof imageUrlToStore === 'string' && process.env.R2_GENERATED_BUCKET) {
          console.log("Watermarking + mirroring generated image to R2:", { source: imageUrlToStore, bucket: process.env.R2_GENERATED_BUCKET });
          const resFetch = await fetch(imageUrlToStore);
          console.log("Fetch source for watermark:", { ok: resFetch.ok, status: resFetch.status, url: imageUrlToStore });
          if (resFetch.ok) {
            const sourceContentType = resFetch.headers.get('content-type') || 'image/jpeg';
            const arrayBuffer = await resFetch.arrayBuffer();
            let uploadBuffer = Buffer.from(arrayBuffer);
            let uploadContentType = sourceContentType;
            let uploadExt = 'jpg';
            try {
              // Apply watermark and force JPEG output
              const { buffer: stampedBuffer, extension, contentType, watermarked } = await watermarkAndPreferJpeg(Buffer.from(arrayBuffer), sourceContentType, {
                marginPx: 24,
                logoWidthRatio: 0.22,
                minLogoWidthPx: 64,
                jpegQuality: 90,
              });
              console.log("Watermark result:", { watermarked, extension, contentType });
              uploadBuffer = stampedBuffer;
              uploadContentType = contentType;
              uploadExt = extension || 'jpg';
            } catch (wmErr) {
              console.error("Watermarking failed; uploading original buffer:", wmErr);
            }

            const key = makeGeneratedKey({ type: validatedData.theme, resourceId: transformation.id, extension: uploadExt });
            await uploadBufferToR2({
              bucket: process.env.R2_GENERATED_BUCKET as string,
              key,
              body: uploadBuffer,
              contentType: uploadContentType,
              cacheControl: 'public, max-age=31536000, immutable',
            });
            console.log("Mirror to R2 successful:", { bucket: process.env.R2_GENERATED_BUCKET, key });
            const publicUrl = generatedPublicUrlForKey(key);
            if (publicUrl) {
              imageUrlToStore = publicUrl;
              console.log("Using public R2 URL for transformation:", publicUrl);
            } else {
              console.warn("Failed to construct public R2 URL; leaving Replicate URL", { key });
            }
          } else {
            console.warn("Failed to fetch source image for watermarking", { status: resFetch.status, source: imageUrlToStore });
          }
        }
      } catch (mirrorErr) {
        console.error('Failed to mirror generated image to R2:', mirrorErr);
      }

      const updatedTransformation = await storage.updatePetTransformation(
        transformation.id,
        { transformedImageUrl: imageUrlToStore }
      );

      res.json({
        success: true,
        transformation: {
          id: transformation.id,
          transformedImageUrl: updatedTransformation?.transformedImageUrl || null,
          stats: updatedTransformation?.stats || transformation.stats,
        },
      });
    } catch (error) {
      console.error("Transformation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({
          message: "Transformation failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Email capture endpoint
  app.post("/api/email-capture", async (req, res) => {
    try {
      const validatedData = emailCaptureSchema.parse(req.body);

      // Check if user exists, create if not
      let user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        user = await storage.createUser({
          email: validatedData.email,
          name: validatedData.name,
        });
      }

      // Update transformation stats (increment downloads)
      const transformation = await storage.getPetTransformation(validatedData.transformationId);
      if (transformation) {
        const currentStats = transformation.stats || { likes: 0, shares: 0, downloads: 0 };
        await storage.updatePetTransformationStats(validatedData.transformationId, {
          ...currentStats,
          downloads: currentStats.downloads + 1,
        });
      }

      // Mock email sending (in real app, integrate with email service)
      console.log(`Sending high-res image to: ${validatedData.email}`);

      res.json({
        success: true,
        message: "High-resolution image sent to your email",
        userId: user.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid email data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Email capture failed", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
  });

  // Get transformation by ID
  app.get("/api/transformations/:id", async (req, res) => {
    try {
      const transformation = await storage.getPetTransformation(req.params.id);
      if (!transformation) {
        return res.status(404).json({ message: "Transformation not found" });
      }

      res.json({ transformation });
    } catch (error) {
      res.status(500).json({ message: "Failed to get transformation", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Social sharing endpoint (increments share count)
  app.post("/api/transformations/:id/share", async (req, res) => {
    try {
      const transformation = await storage.getPetTransformation(req.params.id);
      if (!transformation) {
        return res.status(404).json({ message: "Transformation not found" });
      }

      const currentStats = transformation.stats || { likes: 0, shares: 0, downloads: 0 };
      await storage.updatePetTransformationStats(req.params.id, {
        ...currentStats,
        shares: currentStats.shares + 1,
      });

      res.json({ success: true, message: "Share recorded" });
    } catch (error) {
      res.status(500).json({ message: "Failed to record share", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Custom prompt generation endpoint
  app.post("/api/custom-prompt", async (req, res) => {
    try {
      const validatedData = customPromptSchema.parse(req.body);

      // Generate AI image with custom prompt
      const transformationResult = await createCustomPromptImage({
        prompt: validatedData.prompt,
        petName: validatedData.petName,
        aspectRatio: validatedData.aspectRatio,
        outputFormat: validatedData.outputFormat,
      });

      // Check if AI generation was successful
      if (!transformationResult.success) {
        return res.status(500).json({
          success: false,
          message: "AI image generation failed",
          error: transformationResult.error,
        });
      }

      res.json({
        success: true,
        imageUrl: transformationResult.imageUrl,
        message: "Custom prompt image generated successfully",
      });
    } catch (error) {
      console.error("Custom prompt generation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({
          message: "Custom prompt generation failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Enhance prompt with AI
  app.post("/api/enhance-prompt", async (req, res) => {
    try {
      const validatedData = promptEnhancementSchema.parse(req.body);

      const result = await enhancePrompt(validatedData.prompt, validatedData.petName);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Prompt enhancement failed",
          error: result.error,
        });
      }

      res.json({
        success: true,
        enhancedPrompt: result.enhancedPrompt,
        message: "Prompt enhanced successfully",
      });
    } catch (error) {
      console.error("Prompt enhancement error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({
          message: "Prompt enhancement failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Generate prompt suggestions
  app.post("/api/prompt-suggestions", async (req, res) => {
    try {
      const validatedData = promptSuggestionsSchema.parse(req.body);

      const result = await generatePromptSuggestions(validatedData.theme, validatedData.petName);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Prompt suggestions generation failed",
          error: result.error,
        });
      }

      res.json({
        success: true,
        suggestions: result.suggestions,
        message: "Prompt suggestions generated successfully",
      });
    } catch (error) {
      console.error("Prompt suggestions generation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({
          message: "Prompt suggestions generation failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Debug endpoint to test watermarking on any image URL (dev use only)
  app.get("/api/debug/watermark", async (req, res) => {
    try {
      const url = req.query.url as string | undefined;
      if (!url) {
        return res.status(400).json({ success: false, message: "Missing url query param" });
      }
      const r = await fetch(url);
      if (!r.ok) {
        return res.status(400).json({ success: false, message: `Failed to fetch source image: ${r.status}` });
      }
      const ct = r.headers.get('content-type') || undefined;
      const ab = await r.arrayBuffer();
      const { buffer } = await watermarkAndPreferJpeg(Buffer.from(ab), ct, {
        marginPx: 24,
        logoWidthRatio: 0.08,
        minLogoWidthPx: 64,
        jpegQuality: 90,
      });
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'no-store');
      return res.send(buffer);
    } catch (err: any) {
      console.error("/api/debug/watermark error:", err);
      return res.status(500).json({ success: false, message: err?.message || 'Watermark failed' });
    }
  });

  // Generate pet description
  app.post("/api/pet-description", async (req, res) => {
    try {
      const validatedData = petDescriptionSchema.parse(req.body);

      const result = await generatePetDescription(
        validatedData.petName,
        validatedData.traits,
        validatedData.breed
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Pet description generation failed",
          error: result.error,
        });
      }

      res.json({
        success: true,
        description: result.description,
        message: "Pet description generated successfully",
      });
    } catch (error) {
      console.error("Pet description generation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({
          message: "Pet description generation failed",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  // Generate persona stats/content for final screen
  app.post("/api/persona-stats", async (req, res) => {
    try {
      const schema = z.object({
        petName: z.string().min(1),
        breed: z.string().optional(),
        traits: z.array(z.string()).default([]),
        theme: z.enum(['baseball', 'superhero']),
        tone: z.enum(['whimsical', 'epic', 'sportscaster']).optional(),
        seed: z.number().optional(),
        locale: z.string().optional(),
      });

      const input = schema.parse(req.body);
      const result = await generatePersonaStats(input);

      if (!result.success || !result.content) {
        return res.status(500).json({ success: false, message: "Persona stat generation failed", error: result.error });
      }

      res.json({ success: true, content: result.content });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Persona stats endpoint error:", error);
      res.status(500).json({ success: false, message: "Persona stat generation failed" });
    }
  });

  // Simple admin authentication middleware
  const adminAuth = (req: any, res: any, next: any) => {
    const adminToken = process.env.ADMIN_TOKEN || 'admin123'; // Change this in production
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== adminToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
  };

  // Backend prompt optimization routes (protected)
  app.get("/api/admin/prompt-templates", adminAuth, async (req, res) => {
    try {
      const templates = await storage.getAllPromptTemplates();
      res.json({ success: true, templates });
    } catch (error) {
      console.error("Failed to get prompt templates:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/prompt-templates", adminAuth, async (req, res) => {
    try {
      const templateData = promptTemplateSchema.parse(req.body);
      const template = await storage.createPromptTemplate(templateData);
      res.json({ success: true, template });
    } catch (error) {
      console.error("Failed to create prompt template:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/admin/prompt-templates/:id", adminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const template = await storage.updatePromptTemplate(id, updates);
      if (!template) {
        return res.status(404).json({ success: false, error: "Template not found" });
      }
      res.json({ success: true, template });
    } catch (error) {
      console.error("Failed to update prompt template:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/admin/prompt-variants/:templateId", adminAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const variants = await storage.getPromptVariants(templateId);
      res.json({ success: true, variants });
    } catch (error) {
      console.error("Failed to get prompt variants:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/admin/prompt-variants", adminAuth, async (req, res) => {
    try {
      const variantData = promptVariantSchema.parse(req.body);
      const variant = await storage.createPromptVariant(variantData);
      res.json({ success: true, variant });
    } catch (error) {
      console.error("Failed to create prompt variant:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
