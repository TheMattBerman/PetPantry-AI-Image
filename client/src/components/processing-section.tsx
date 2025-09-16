import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Theme, TransformationResult } from "@/lib/types";

interface ProcessingSectionProps {
  selectedTheme: Theme;
  onComplete: (result: TransformationResult) => void;
  uploadedFile?: File | null;
  petData?: any;
}

const PROCESSING_STEPS = {
  baseball: [
    "Analyzing your pet's features...",
    "Selecting the perfect baseball style...",
    "Generating custom stats and details...",
    "Adding finishing touches...",
    "Almost ready!",
  ],
  superhero: [
    "Analyzing your pet's features...",
    "Selecting the perfect superhero style...",
    "Generating super powers and abilities...",
    "Adding cape and mask effects...",
    "Almost ready!",
  ],
};

export default function ProcessingSection({ selectedTheme, onComplete, uploadedFile, petData }: ProcessingSectionProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = PROCESSING_STEPS[selectedTheme];

  // Real image generation mutation
  const generateImage = useMutation({
    mutationFn: async () => {
      if (!petData) {
        throw new Error('Missing required data for image generation');
      }

      const transformationData = {
        petName: petData.petName || 'Pet',
        theme: selectedTheme,
        petBreed: petData.petBreed || '',
        traits: petData.traits || [],
        customMessage: petData.customMessage || '',
        originalImageUrl: 'user-uploaded-image', // Placeholder since we don't handle actual upload yet
      };

      const response = await apiRequest('POST', '/api/transformations', transformationData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.transformation) {
        const result: TransformationResult = {
          id: data.transformation.id || `transformation_${Date.now()}`,
          transformedImageUrl: data.transformation.transformedImageUrl || data.imageUrl,
          stats: data.transformation.stats || {
            likes: Math.floor(Math.random() * 500) + 100,
            shares: Math.floor(Math.random() * 200) + 50,
            downloads: Math.floor(Math.random() * 300) + 100,
          },
        };
        onComplete(result);
      } else {
        console.error('Image generation failed:', data.error || data.message);
        // Fallback to mock result for now
        const mockResult: TransformationResult = {
          id: `transformation_${Date.now()}`,
          transformedImageUrl: selectedTheme === 'baseball' 
            ? "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=600"
            : "https://images.unsplash.com/photo-1571566882372-1598d88abd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=600",
          stats: {
            likes: Math.floor(Math.random() * 500) + 100,
            shares: Math.floor(Math.random() * 200) + 50,
            downloads: Math.floor(Math.random() * 300) + 100,
          },
        };
        onComplete(mockResult);
      }
    },
    onError: (error) => {
      console.error('Image generation error:', error);
      // Fallback to mock result for now
      const mockResult: TransformationResult = {
        id: `transformation_${Date.now()}`,
        transformedImageUrl: selectedTheme === 'baseball' 
          ? "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=600"
          : "https://images.unsplash.com/photo-1571566882372-1598d88abd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=600",
        stats: {
          likes: Math.floor(Math.random() * 500) + 100,
          shares: Math.floor(Math.random() * 200) + 50,
          downloads: Math.floor(Math.random() * 300) + 100,
        },
      };
      onComplete(mockResult);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 8;
        if (newProgress >= 95 && !generateImage.isPending && !generateImage.isSuccess) {
          // Start real image generation when progress reaches 95%
          generateImage.mutate();
          return 95; // Hold at 95% until generation completes
        } else if (generateImage.isSuccess && newProgress >= 95) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(newProgress, 94); // Don't go above 94% until ready to generate
      });
    }, Math.random() * 1000 + 500);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [selectedTheme, onComplete, steps.length, generateImage]);

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <div className="max-w-2xl mx-auto text-center">
        <div className="loading-spinner mx-auto mb-6"></div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Creating Your Pet's Masterpiece
        </h3>
        <p className="text-gray-600 mb-8">
          Our AI is working its magic to transform your furry friend...
        </p>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-6" />

        {/* Progress Steps */}
        <div className="space-y-2 text-sm text-gray-600">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center justify-center space-x-2">
              {index < currentStepIndex ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : index === currentStepIndex ? (
                <Loader2 className="w-4 h-4 text-brand-accent animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={index <= currentStepIndex ? "text-gray-800" : "text-gray-400"}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
