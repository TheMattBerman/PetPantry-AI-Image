import { useState } from "react";
import HeroSection from "@/components/hero-section";
import UploadSection from "@/components/upload-section";
import ThemeSelection from "@/components/theme-selection";
import CustomizationForm from "@/components/customization-form";
import EmailGate from "@/components/email-gate";
import ProcessingSection from "@/components/processing-section";
import ResultSection from "@/components/result-section";
import { PawPrint } from "lucide-react";
import type { AppState, Theme } from "@/lib/types";

export default function Home() {
  const [appState, setAppState] = useState<AppState>({
    currentStep: 'hero',
    uploadedFile: null,
    selectedTheme: null,
    petData: null,
    userEmail: null,
    transformationResult: null,
  });

  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  const resetApp = () => {
    setAppState({
      currentStep: 'hero',
      uploadedFile: null,
      selectedTheme: null,
      petData: null,
      userEmail: null,
      transformationResult: null,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <PawPrint className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">The Pet Pantry</h1>
            </div>
            <div className="text-sm text-gray-600">
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                FREE TOOL
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState.currentStep === 'hero' && (
          <HeroSection onStart={() => updateState({ currentStep: 'upload' })} />
        )}
        
        {appState.currentStep === 'upload' && (
          <UploadSection
            onFileUploaded={(file) => updateState({ uploadedFile: file, currentStep: 'theme' })}
            uploadedFile={appState.uploadedFile}
          />
        )}
        
        {appState.currentStep === 'theme' && (
          <ThemeSelection
            selectedTheme={appState.selectedTheme}
            onThemeSelected={(theme) => updateState({ selectedTheme: theme, currentStep: 'customize' })}
          />
        )}
        
        {appState.currentStep === 'customize' && (
          <CustomizationForm
            selectedTheme={appState.selectedTheme!}
            onSubmit={(petData) => updateState({ petData, currentStep: 'email-gate' })}
          />
        )}
        
        {appState.currentStep === 'email-gate' && (
          <EmailGate
            petData={appState.petData!}
            selectedTheme={appState.selectedTheme!}
            onEmailSubmit={(email) => updateState({ userEmail: email, currentStep: 'processing' })}
          />
        )}
        
        {appState.currentStep === 'processing' && (
          <ProcessingSection
            selectedTheme={appState.selectedTheme!}
            onComplete={(result) => updateState({ transformationResult: result, currentStep: 'result' })}
          />
        )}
        
        {appState.currentStep === 'result' && (
          <ResultSection
            transformationResult={appState.transformationResult!}
            petData={appState.petData!}
            userEmail={appState.userEmail!}
            onCreateAnother={resetApp}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <PawPrint className="text-white" />
              </div>
              <h4 className="text-lg font-bold">The Pet Pantry</h4>
            </div>
            <p className="text-gray-300 mb-4">Transforming pets into stars, one photo at a time</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="text-gray-300 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-300 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-300 hover:text-white">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
}
