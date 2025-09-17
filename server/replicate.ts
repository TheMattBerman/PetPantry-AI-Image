import Replicate from "replicate";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error("REPLICATE_API_TOKEN environment variable is required");
}

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "2:3", // Baseball card ratio
          output_format: "png",
          output_quality: 90,
        }
      }
    );

    console.log("Baseball card Replicate output:", JSON.stringify(output, null, 2));
    console.log("Output type:", typeof output);
    console.log("Is array:", Array.isArray(output));

    if (Array.isArray(output) && output.length > 0) {
      console.log("Successfully returning image URL:", output[0]);
      return {
        success: true,
        imageUrl: output[0],
      };
    }

    return {
      success: false,
      error: "No image generated",
    };
  } catch (error) {
    console.error("Baseball card generation error:", error);
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

    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "3:4", // Superhero poster ratio
          output_format: "png", 
          output_quality: 90,
        }
      }
    );

    if (Array.isArray(output) && output.length > 0) {
      return {
        success: true,
        imageUrl: output[0],
      };
    }

    return {
      success: false,
      error: "No image generated",
    };
  } catch (error) {
    console.error("Superhero image generation error:", error);
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
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: enhancedPrompt,
          num_outputs: 1,
          aspect_ratio: input.aspectRatio,
          output_format: input.outputFormat,
          output_quality: 90,
        }
      }
    );

    console.log("Custom prompt Replicate output:", JSON.stringify(output, null, 2));
    console.log("Output type:", typeof output);
    console.log("Is array:", Array.isArray(output));

    if (Array.isArray(output) && output.length > 0) {
      console.log("Successfully returning custom prompt image URL:", output[0]);
      return {
        success: true,
        imageUrl: output[0],
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