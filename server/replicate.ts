import Replicate from "replicate";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error("REPLICATE_API_TOKEN environment variable is required");
}

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Helper function to resolve different image input types for Replicate
 */
async function resolveImageInput(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('temp://')) {
    // Handle temporary uploaded files by uploading to Replicate first
    const tempFileId = imageUrl.replace('temp://', '');
    const tempFiles = (global as any).tempFiles || new Map();
    const fileData = tempFiles.get(tempFileId);
    
    if (!fileData) {
      throw new Error('Uploaded file not found or expired');
    }
    
    console.log("Uploading temp file to Replicate...");
    // Upload the buffer to Replicate and get a URL
    const uploadedFile = await replicate.files.create(fileData.buffer);
    console.log("Replicate upload successful:", uploadedFile.id);
    return uploadedFile.urls.get;
  } else {
    // Handle regular HTTP URLs
    return imageUrl;
  }
}

// Types for Replicate model inputs and outputs
export interface BaseballCardInput {
  petImageUrl: string;
  petName: string;
  petBreed?: string;
  team?: string;
  position?: string;
  stats?: Record<string, number>;
}

export interface SuperheroInput {
  petImageUrl: string;
  petName: string;
  petBreed?: string;
  heroName?: string;
  powers?: string[];
}

export interface CustomPromptInput {
  prompt: string;
  petName: string;
  aspectRatio: string;
  outputFormat: string;
}

export interface TransformationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Transform a pet photo into a baseball card style image
 */
export async function createBaseballCard(input: BaseballCardInput): Promise<TransformationResult> {
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import("./storage");
    
    // Get the active baseball prompt template from backend
    const template = await storage.getActivePromptTemplate('baseball');
    let basePrompt = template?.basePrompt || `Create a professional baseball card featuring a ${input.petName} pet. 
    Style: Vintage baseball card design with clean borders, team colors, and stats section.
    Pet name: "${input.petName}"
    ${input.team ? `Team: "${input.team}"` : ''}
    ${input.position ? `Position: "${input.position}"` : 'Position: "Good Boy/Girl"'}
    Include realistic pet stats like "Fetch Success Rate", "Treats Consumed", "Naps Per Day".
    Professional sports photography style, high quality, detailed.`;
    
    // Get the best performing variant if available
    if (template) {
      const bestVariant = await storage.getBestPromptVariant(template.id);
      if (bestVariant && bestVariant.id) {
        basePrompt = bestVariant.prompt;
        // Update usage stats
        await storage.updatePromptVariantStats(bestVariant.id, bestVariant.successRate || 0);
      }
    }
    
    // Replace placeholders with actual values - use replaceAll for multiple occurrences
    const prompt = basePrompt
      .replaceAll('{petName}', input.petName)
      .replaceAll('{petBreed}', convertBreedToReadable(input.petBreed || 'pet'))
      .replaceAll('{team}', input.team || '')
      .replaceAll('{position}', input.position || 'Good Boy/Girl');

    // Resolve the image input using our shared helper
    const resolvedImage = await resolveImageInput(input.petImageUrl);

    console.log("=== BEFORE NANO-BANANA CALL ===");
    console.log("Model: google/nano-banana:63aa4a33b7b30c8c4f6d1d6ae77efc71b7e8b98c72dba8afb7bdd6a62c4b55c5");
    console.log("Prompt:", prompt);
    console.log("Image type:", typeof resolvedImage);
    console.log("Image URL:", resolvedImage);
    console.log("=== CALLING REPLICATE ===");
    
    const output = await replicate.run(
      "google/nano-banana:63aa4a33b7b30c8c4f6d1d6ae77efc71b7e8b98c72dba8afb7bdd6a62c4b55c5",
      {
        input: {
          image: resolvedImage, // Use standard 'image' parameter
          prompt: prompt,
        }
      }
    );
    
    // Wait for the prediction to complete if it's a stream/promise
    let finalOutput: any = output;
    if (output && typeof output === 'object' && 'then' in output) {
      finalOutput = await (output as Promise<any>);
    }

    console.log("=== BASEBALL CARD TRANSFORMATION DEBUG ===");
    console.log("Input prompt:", prompt);
    console.log("Resolved image URL:", resolvedImage);
    console.log("Output constructor:", finalOutput?.constructor?.name);
    console.log("Output type:", typeof finalOutput);
    console.log("Is array:", Array.isArray(finalOutput));
    console.log("=== END DEBUG ===");

    // Handle Blob/file outputs by uploading them to get a URL
    if ((typeof Blob !== 'undefined' && finalOutput instanceof Blob) || (finalOutput && typeof finalOutput.arrayBuffer === 'function')) {
      console.log("Detected Blob output, uploading to get URL...");
      try {
        const uploadedResult = await replicate.files.create(finalOutput);
        console.log("Successfully uploaded result:", uploadedResult.id);
        return {
          success: true,
          imageUrl: uploadedResult.urls.get,
        };
      } catch (error) {
        console.error("Failed to upload result blob:", error);
        return {
          success: false,
          error: "Failed to process generated image",
        };
      }
    }

    // Handle direct URL string responses
    if (typeof finalOutput === 'string' && finalOutput && finalOutput.includes('http')) {
      console.log("Successfully returning image URL:", finalOutput);
      return {
        success: true,
        imageUrl: finalOutput,
      };
    } 
    
    // Handle array responses
    if (Array.isArray(finalOutput) && finalOutput.length > 0) {
      let imageUrl = finalOutput[0];
      
      // Handle ReadableStream or other non-string responses
      if (typeof imageUrl !== 'string') {
        console.log("Non-string response detected, type:", typeof imageUrl);
        console.log("Response value:", imageUrl);
        
        // If it's a ReadableStream or URL object, try to extract the actual URL
        if (imageUrl && typeof imageUrl === 'object' && imageUrl.toString) {
          imageUrl = imageUrl.toString();
        } else {
          console.error("Unable to extract URL from response:", imageUrl);
          return {
            success: false,
            error: "Invalid image URL response from AI service",
          };
        }
      }
      
      console.log("Successfully returning image URL:", imageUrl);
      return {
        success: true,
        imageUrl: imageUrl,
      };
    }

    // Handle object responses that might contain URLs
    if (finalOutput && typeof finalOutput === 'object') {
      console.log("Object output detected, checking for URL fields...");
      if (finalOutput.image && typeof finalOutput.image === 'string') {
        return {
          success: true,
          imageUrl: finalOutput.image,
        };
      }
      if (finalOutput.images && Array.isArray(finalOutput.images) && finalOutput.images.length > 0) {
        return {
          success: true,
          imageUrl: finalOutput.images[0],
        };
      }
    }

    console.log("No valid output format detected");
    return {
      success: false,
      error: "No image generated",
    };
  } catch (error) {
    console.error("=== BASEBALL CARD ERROR ===");
    console.error("Full error object:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("=== END ERROR ===");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Transform a pet photo into a superhero style image
 */
export async function createSuperheroImage(input: SuperheroInput): Promise<TransformationResult> {
  try {
    // Import storage here to avoid circular dependency
    const { storage } = await import("./storage");
    
    const heroName = input.heroName || `Super ${input.petName}`;
    const powers = input.powers?.join(", ") || "super speed, incredible loyalty, treat detection";
    
    // Get the active superhero prompt template from backend
    const template = await storage.getActivePromptTemplate('superhero');
    let basePrompt = template?.basePrompt || `Create a superhero-style image featuring a {petName} pet as "{heroName}".
    Style: Comic book superhero aesthetic with cape, mask, and heroic pose.
    Pet name: "{petName}"
    Hero name: "{heroName}"
    Powers: {powers}
    Dynamic superhero pose, vibrant colors, cape flowing, heroic lighting.
    Professional comic book art style, high quality, detailed.`;
    
    // Get the best performing variant if available
    if (template) {
      const bestVariant = await storage.getBestPromptVariant(template.id);
      if (bestVariant && bestVariant.id) {
        basePrompt = bestVariant.prompt;
        // Update usage stats
        await storage.updatePromptVariantStats(bestVariant.id, bestVariant.successRate || 0);
      }
    }
    
    // Replace placeholders with actual values - use replaceAll for multiple occurrences
    const prompt = basePrompt
      .replaceAll('{petName}', input.petName)
      .replaceAll('{petBreed}', convertBreedToReadable(input.petBreed || 'pet'))
      .replaceAll('{heroName}', heroName)
      .replaceAll('{powers}', powers);

    // Resolve the image input using our shared helper
    const resolvedImage = await resolveImageInput(input.petImageUrl);

    console.log("=== BEFORE NANO-BANANA CALL ===");
    console.log("Model: google/nano-banana:63aa4a33b7b30c8c4f6d1d6ae77efc71b7e8b98c72dba8afb7bdd6a62c4b55c5");
    console.log("Prompt:", prompt);
    console.log("Image type:", typeof resolvedImage);
    console.log("Image URL:", resolvedImage);
    console.log("=== CALLING REPLICATE ===");
    
    const output = await replicate.run(
      "google/nano-banana:63aa4a33b7b30c8c4f6d1d6ae77efc71b7e8b98c72dba8afb7bdd6a62c4b55c5",
      {
        input: {
          image: resolvedImage, // Use standard 'image' parameter
          prompt: prompt,
        }
      }
    );
    
    // Wait for the prediction to complete if it's a stream/promise
    let finalOutput: any = output;
    if (output && typeof output === 'object' && 'then' in output) {
      finalOutput = await (output as Promise<any>);
    }

    console.log("=== SUPERHERO TRANSFORMATION DEBUG ===");
    console.log("Input prompt:", prompt);
    console.log("Resolved image type:", typeof resolvedImage);
    console.log("Resolved image URL:", resolvedImage);
    console.log("Superhero Replicate output:", JSON.stringify(finalOutput, null, 2));
    console.log("Output type:", typeof finalOutput);
    console.log("Is array:", Array.isArray(finalOutput));
    console.log("=== END DEBUG ===");

    // nano-banana returns a direct URL string, not an array
    if (typeof finalOutput === 'string' && finalOutput && finalOutput.includes('http')) {
      console.log("Successfully returning image URL:", finalOutput);
      return {
        success: true,
        imageUrl: finalOutput,
      };
    } else if (Array.isArray(finalOutput) && finalOutput.length > 0) {
      let imageUrl = finalOutput[0];
      
      // Handle ReadableStream or other non-string responses
      if (typeof imageUrl !== 'string') {
        console.log("Non-string response detected, type:", typeof imageUrl);
        console.log("Response value:", imageUrl);
        
        // If it's a ReadableStream or URL object, try to extract the actual URL
        if (imageUrl && typeof imageUrl === 'object' && imageUrl.toString) {
          imageUrl = imageUrl.toString();
        } else {
          console.error("Unable to extract URL from response:", imageUrl);
          return {
            success: false,
            error: "Invalid image URL response from AI service",
          };
        }
      }
      
      console.log("Successfully returning image URL:", imageUrl);
      return {
        success: true,
        imageUrl: imageUrl,
      };
    }

    return {
      success: false,
      error: "No image generated",
    };
  } catch (error) {
    console.error("=== SUPERHERO ERROR ===");
    console.error("Full error object:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("=== END ERROR ===");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate a custom image using a user-provided prompt
 */
export async function createCustomPromptImage(input: CustomPromptInput): Promise<TransformationResult> {
  try {
    // Use the custom prompt directly with the pet name integrated
    const enhancedPrompt = `${input.prompt}. Pet name: "${input.petName}". High quality, detailed, professional.`;

    const output = await replicate.run(
      "google/nano-banana",
      {
        input: {
          prompt: enhancedPrompt,
          image_input: [], // No input image for custom prompts
          output_format: input.outputFormat,
        }
      }
    );
    
    // Wait for the prediction to complete if it's a stream/promise
    let finalOutput: any = output;
    if (output && typeof output === 'object' && 'then' in output) {
      finalOutput = await (output as Promise<any>);
    }

    console.log("Custom prompt Replicate output:", JSON.stringify(finalOutput, null, 2));
    console.log("Output type:", typeof finalOutput);
    console.log("Is array:", Array.isArray(finalOutput));

    // nano-banana returns a direct URL string, not an array
    if (typeof finalOutput === 'string' && finalOutput && finalOutput.includes('http')) {
      console.log("Successfully returning image URL:", finalOutput);
      return {
        success: true,
        imageUrl: finalOutput,
      };
    } else if (Array.isArray(finalOutput) && finalOutput.length > 0) {
      let imageUrl = finalOutput[0];
      
      // Handle ReadableStream or other non-string responses
      if (typeof imageUrl !== 'string') {
        console.log("Non-string response detected, type:", typeof imageUrl);
        console.log("Response value:", imageUrl);
        
        // If it's a ReadableStream or URL object, try to extract the actual URL
        if (imageUrl && typeof imageUrl === 'object' && imageUrl.toString) {
          imageUrl = imageUrl.toString();
        } else {
          console.error("Unable to extract URL from response:", imageUrl);
          return {
            success: false,
            error: "Invalid image URL response from AI service",
          };
        }
      }
      
      console.log("Successfully returning custom prompt image URL:", imageUrl);
      return {
        success: true,
        imageUrl: imageUrl,
      };
    }

    return {
      success: false,
      error: "No image generated",
    };
  } catch (error) {
    console.error("Custom prompt image generation error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Convert breed form values to readable names
 */
function convertBreedToReadable(breed: string): string {
  const breedMap: Record<string, string> = {
    'golden-retriever': 'Golden Retriever',
    'labrador': 'Labrador',
    'german-shepherd': 'German Shepherd',
    'bulldog': 'Bulldog',
    'poodle': 'Poodle',
    'cat-persian': 'Persian Cat',
    'cat-siamese': 'Siamese Cat',
    'cat-maine-coon': 'Maine Coon',
    'other': 'beloved pet',
  };
  return breedMap[breed] || breed || 'pet';
}

/**
 * Generate mock stats for baseball cards
 */
export function generateBaseballStats(petName: string, traits: string[] = []): Record<string, number> {
  const baseStats = {
    "Fetch Success Rate": Math.floor(Math.random() * 15) + 85, // 85-99%
    "Treats Per Day": Math.floor(Math.random() * 10) + 5, // 5-14
    "Naps Completed": Math.floor(Math.random() * 5) + 8, // 8-12
    "Belly Rubs Given": Math.floor(Math.random() * 20) + 30, // 30-49
    "Squirrels Chased": Math.floor(Math.random() * 25) + 15, // 15-39
  };

  // Adjust stats based on traits
  traits.forEach(trait => {
    switch (trait.toLowerCase()) {
      case 'energetic':
        baseStats["Fetch Success Rate"] = Math.min(99, baseStats["Fetch Success Rate"] + 5);
        baseStats["Squirrels Chased"] = Math.min(99, baseStats["Squirrels Chased"] + 10);
        break;
      case 'lazy':
        baseStats["Naps Completed"] = Math.min(20, baseStats["Naps Completed"] + 5);
        baseStats["Belly Rubs Given"] = Math.min(99, baseStats["Belly Rubs Given"] + 10);
        break;
      case 'foodie':
        baseStats["Treats Per Day"] = Math.min(30, baseStats["Treats Per Day"] + 8);
        break;
    }
  });

  return baseStats;
}