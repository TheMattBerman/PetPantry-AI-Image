import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Download, Share, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CustomPromptData {
  prompt: string;
  petName: string;
  aspectRatio: string;
  outputFormat: string;
}

export default function PromptTesting() {
  const [promptData, setPromptData] = useState<CustomPromptData>({
    prompt: "",
    petName: "Buddy",
    aspectRatio: "1:1",
    outputFormat: "webp"
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImageMutation = useMutation({
    mutationFn: async (data: CustomPromptData) => {
      const response = await apiRequest('POST', '/api/custom-prompt', data);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate image');
      }
      return result;
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Image Generated!",
        description: "Your custom prompt image has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!promptData.prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive",
      });
      return;
    }
    generateImageMutation.mutate(promptData);
  };

  const examplePrompts = [
    "A majestic golden retriever wearing a crown, sitting on a royal throne in a fantasy castle, digital art style, highly detailed",
    "A tabby cat as a superhero flying through the city skyline at sunset, cape flowing in the wind, comic book style",
    "A corgi dressed as an astronaut floating in space with Earth in the background, photorealistic, NASA photography style",
    "A french bulldog as a chef in a professional kitchen, wearing a chef's hat, surrounded by cooking ingredients, warm lighting"
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-page-title">
            Prompt Testing Playground
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-page-description">
            Experiment with custom prompts to create unique pet images. Test different styles, 
            scenarios, and artistic approaches with the google/nano-banana model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Custom Prompt Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pet-name">Pet Name</Label>
                  <Input
                    id="pet-name"
                    data-testid="input-pet-name"
                    value={promptData.petName}
                    onChange={(e) => setPromptData({ ...promptData, petName: e.target.value })}
                    placeholder="Enter your pet's name"
                  />
                </div>

                <div>
                  <Label htmlFor="custom-prompt">Custom Prompt</Label>
                  <Textarea
                    id="custom-prompt"
                    data-testid="textarea-custom-prompt"
                    value={promptData.prompt}
                    onChange={(e) => setPromptData({ ...promptData, prompt: e.target.value })}
                    placeholder="Describe the image you want to create..."
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                    <Select
                      value={promptData.aspectRatio}
                      onValueChange={(value) => setPromptData({ ...promptData, aspectRatio: value })}
                    >
                      <SelectTrigger data-testid="select-aspect-ratio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="2:3">Portrait (2:3)</SelectItem>
                        <SelectItem value="3:4">Photo (3:4)</SelectItem>
                        <SelectItem value="4:3">Landscape (4:3)</SelectItem>
                        <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="output-format">Format</Label>
                    <Select
                      value={promptData.outputFormat}
                      onValueChange={(value) => setPromptData({ ...promptData, outputFormat: value })}
                    >
                      <SelectTrigger data-testid="select-output-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webp">WebP</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateImageMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-generate-image"
                >
                  {generateImageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card>
              <CardHeader>
                <CardTitle>Example Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {examplePrompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => setPromptData({ ...promptData, prompt })}
                      data-testid={`example-prompt-${index}`}
                    >
                      <p className="text-sm text-gray-700">{prompt}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Generated Image</CardTitle>
              </CardHeader>
              <CardContent>
                {generateImageMutation.isPending ? (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center" data-testid="image-loading">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400 mb-4" />
                      <p className="text-gray-600">Generating your custom image...</p>
                    </div>
                  </div>
                ) : generatedImage ? (
                  <div className="space-y-4">
                    <img
                      src={generatedImage}
                      alt="Generated pet image"
                      className="w-full rounded-lg shadow-lg"
                      data-testid="image-generated-result"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" data-testid="button-like">
                        <Heart className="mr-2 h-4 w-4" />
                        Like
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" data-testid="button-share">
                        <Share className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" data-testid="button-download">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center" data-testid="image-placeholder">
                    <div className="text-center">
                      <Wand2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">Your generated image will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}