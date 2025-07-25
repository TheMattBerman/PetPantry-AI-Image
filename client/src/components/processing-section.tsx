import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";
import type { Theme, TransformationResult } from "@/lib/types";

interface ProcessingSectionProps {
  selectedTheme: Theme;
  onComplete: (result: TransformationResult) => void;
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

export default function ProcessingSection({ selectedTheme, onComplete }: ProcessingSectionProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = PROCESSING_STEPS[selectedTheme];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 20 + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Mock transformation result
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
          }, 1000);
          return 100;
        }
        return newProgress;
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
  }, [selectedTheme, onComplete, steps.length]);

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
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
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
