import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertPetTransformationSchema, promptTemplateSchema, promptVariantSchema } from "@shared/schema";
import { createBaseballCard, createSuperheroImage, generateBaseballStats, createCustomPromptImage } from "./replicate";
import { enhancePrompt, generatePromptSuggestions, generatePetDescription } from "./openai";

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

  // Get app statistics (mock data for now)
  app.get("/api/stats", (req, res) => {
    res.json({
      totalUsers: 25847,
      totalShares: 89234,
      totalTransformations: 42156,
    });
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('petPhoto'), (req, res) => {
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

      // Store the uploaded file buffer and create a temporary identifier
      // We'll use Replicate's built-in file handling directly in the transformation
      const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Store file in a simple in-memory cache (for production, use cloud storage)
      global.tempFiles = global.tempFiles || new Map();
      global.tempFiles.set(tempFileId, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        uploadedAt: Date.now()
      });
      
      // Clean up old files (older than 1 hour)
      for (const [id, fileData] of global.tempFiles.entries()) {
        if (Date.now() - fileData.uploadedAt > 3600000) {
          global.tempFiles.delete(id);
        }
      }
      
      res.json({
        success: true,
        fileUrl: `temp://${tempFileId}`, // Special identifier for temp files
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
          team: "Pet Pantry All-Stars",
          position: "Good Boy/Girl",
          stats: stats,
        });
      } else if (validatedData.theme === 'superhero') {
        transformationResult = await createSuperheroImage({
          petImageUrl: transformation.originalImageUrl || "",
          petName: validatedData.petName,
          petBreed: validatedData.petBreed || 'pet',
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

      // Update transformation with generated image URL in database
      console.log("Transformation result:", JSON.stringify(transformationResult, null, 2));
      console.log("Image URL type:", typeof transformationResult.imageUrl);
      console.log("Image URL value:", transformationResult.imageUrl);
      
      // Handle the case where imageUrl might be an object or stream
      let imageUrlToStore = null;
      if (transformationResult.imageUrl) {
        if (typeof transformationResult.imageUrl === 'string') {
          imageUrlToStore = transformationResult.imageUrl;
        } else if (typeof transformationResult.imageUrl === 'object') {
          // For now, store a placeholder until we fix the Replicate integration
          imageUrlToStore = 'ai-generated-placeholder-url';
          console.log("Storing placeholder URL since imageUrl is an object:", transformationResult.imageUrl);
        } else {
          imageUrlToStore = String(transformationResult.imageUrl);
        }
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
