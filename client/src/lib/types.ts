export type Theme = 'baseball' | 'superhero';

export type Step = 'hero' | 'upload' | 'theme' | 'customize' | 'email-gate' | 'processing' | 'result';

export type PetGender = 'male' | 'female' | 'neutral';

export interface PetData {
  name: string;
  breed?: string;
  traits: string[];
  gender: PetGender;
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

export interface SiteMetrics {
  id: string;
  transforms: number;
  shares: number;
  updatedAt: string;
}

export interface PersonaStatItem {
  label: string;
  value: number | string;
  blurb: string;
}

export interface PersonaSignatureMove {
  name: string;
  description: string;
}

export interface PersonaFlavorItem {
  title: string;
  content: string;
}

export interface PersonaContent {
  personaName: string;
  personaTitle: string;
  stats: PersonaStatItem[];
  signatureMove: PersonaSignatureMove;
  origin: string;
  catchphrase: string;
  flavor: PersonaFlavorItem[];
}

export interface AppState {
  currentStep: Step;
  uploadedFile: File | null;
  selectedTheme: Theme | null;
  petData: PetData | null;
  userEmail: string | null;
  userName?: string | null;
  transformationResult: TransformationResult | null;
}
