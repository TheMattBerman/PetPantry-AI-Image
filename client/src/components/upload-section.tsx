import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, ArrowRight, Edit, AlertTriangle } from "lucide-react";

interface UploadSectionProps {
  onFileUploaded: (file: File) => void;
  uploadedFile: File | null;
}

export default function UploadSection({ onFileUploaded, uploadedFile }: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      return 'Please upload a JPEG or PNG image file.';
    }

    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB.';
    }

    // Mock pet detection - in real app, this would be AI-powered
    const petKeywords = ['dog', 'cat', 'pet', 'puppy', 'kitten'];
    const isPet = petKeywords.some(keyword => file.name.toLowerCase().includes(keyword)) || Math.random() > 0.1;

    if (!isPet) {
      return "We couldn't detect a pet in this image. Please try another photo.";
    }

    return null;
  };

  const handleFileUpload = (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      onFileUploaded(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleChangePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Step 1: Upload Your Pet's Photo
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Choose a clear, well-lit photo of your pet for the best results
        </p>

        {/* Upload Zone */}
        <div
          className={`upload-zone rounded-lg p-8 text-center cursor-pointer mb-4 ${isDragOver ? 'dragover' : ''
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleZoneClick}
        >
          {!previewUrl ? (
            <div>
              <CloudUpload className="text-4xl text-gray-400 mb-4 mx-auto w-16 h-16" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag & drop your pet's photo here
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse your files</p>
              <p className="text-xs text-gray-400">Supports JPEG, PNG • Max 10MB</p>
            </div>
          ) : (
            <div>
              <img
                src={previewUrl}
                alt="Pet preview"
                className="max-w-full h-64 object-cover rounded-lg mx-auto mb-4"
              />
              <p className="text-sm text-gray-600 mb-2">Looking good! 🐕</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChangePhoto}
                className="text-blue-500 hover:text-blue-600"
              >
                <Edit className="mr-1 w-4 h-4" />
                Change Photo
              </Button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <p className="text-xs text-gray-500 text-center mb-6">
          By uploading, you agree to The Pet Pantry using your pet photo in marketing materials.
        </p>

        {/* Error Messages */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <Button
            disabled={!uploadedFile}
            size="lg"
            className="brand-button disabled:opacity-50"
          >
            Continue to Themes
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
