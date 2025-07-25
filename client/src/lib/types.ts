export type Theme = 'baseball' | 'superhero';

export type Step = 'hero' | 'upload' | 'theme' | 'customize' | 'email-gate' | 'processing' | 'result';

export interface PetData {
  name: string;
  breed?: string;
  traits: string[];
  customMessage?: string;
}

export interface TransformationResult {
  id: string;
  transformedImageUrl: string;
  stats: {
    likes: number;
    shares: number;
    downloads: number;
  };
}

export interface AppState {
  currentStep: Step;
  uploadedFile: File | null;
  selectedTheme: Theme | null;
  petData: PetData | null;
  userEmail: string | null;
  transformationResult: TransformationResult | null;
}
