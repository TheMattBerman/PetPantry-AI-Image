import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertUserSchema, insertPetTransformationSchema } from "@shared/schema";
import { createBaseballCard, createSuperheroImage, generateBaseballStats } from "./replicate";

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

      // In a real app, you would save the file to cloud storage
      const fileUrl = `https://images.unsplash.com/photo-${Date.now()}`;
      
      res.json({
        success: true,
        fileUrl,
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
        originalImageUrl: req.body.originalImageUrl || "placeholder-url",
      });

      // Generate AI transformation based on theme
      let transformationResult;
      
      if (validatedData.theme === 'baseball') {
        // Generate baseball card stats
        const stats = generateBaseballStats(validatedData.petName, (validatedData.traits as string[]) || []);
        
        transformationResult = await createBaseballCard({
          petImageUrl: transformation.originalImageUrl || "",
          petName: validatedData.petName,
          team: "Pet Pantry All-Stars",
          position: "Good Boy/Girl",
          stats: stats,
        });
      } else if (validatedData.theme === 'superhero') {
        transformationResult = await createSuperheroImage({
          petImageUrl: transformation.originalImageUrl || "",
          petName: validatedData.petName,
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

  const httpServer = createServer(app);
  return httpServer;
}
