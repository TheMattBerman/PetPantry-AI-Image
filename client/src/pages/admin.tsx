import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Edit, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PromptTemplate {
  id: number;
  name: string;
  category: string;
  basePrompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromptVariant {
  id: number;
  templateId: number;
  prompt: string;
  successRate: number;
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPromptOptimization() {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "superhero",
    basePrompt: "",
  });
  const [newVariant, setNewVariant] = useState({
    prompt: "",
    templateId: 0,
  });
  const { toast } = useToast();

  // Fetch all prompt templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/admin/prompt-templates'],
  });

  // Fetch variants for selected template
  const { data: variantsData } = useQuery({
    queryKey: ['/api/admin/prompt-variants', selectedTemplate?.id],
    enabled: !!selectedTemplate?.id,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof newTemplate) => {
      const response = await apiRequest('POST', '/api/admin/prompt-templates', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompt-templates'] });
      setNewTemplate({ name: "", category: "superhero", basePrompt: "" });
      toast({
        title: "Template Created!",
        description: "New prompt template has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Template",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: typeof newVariant) => {
      const response = await apiRequest('POST', '/api/admin/prompt-variants', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/prompt-variants', selectedTemplate?.id] });
      setNewVariant({ prompt: "", templateId: 0 });
      toast({
        title: "Variant Created!",
        description: "New prompt variant has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Variant",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.basePrompt) {
      toast({
        title: "Missing Information",
        description: "Please fill in both name and base prompt.",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate(newTemplate);
  };

  const handleCreateVariant = () => {
    if (!newVariant.prompt || !selectedTemplate) {
      toast({
        title: "Missing Information",
        description: "Please select a template and enter a prompt.",
        variant: "destructive",
      });
      return;
    }
    createVariantMutation.mutate({
      ...newVariant,
      templateId: selectedTemplate.id,
    });
  };

  const templates = (templatesData as any)?.templates || [];
  const variants = (variantsData as any)?.variants || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Backend Prompt Optimization
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage and optimize prompts for superhero and baseball card transformations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt Templates Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  data-testid="input-template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Enhanced Superhero Prompt v2"
                />
              </div>

              <div>
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={newTemplate.category}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                >
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superhero">Superhero</SelectItem>
                    <SelectItem value="baseball">Baseball Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template-prompt">Base Prompt (use {"{petName}"}, {"{heroName}"}, etc.)</Label>
                <Textarea
                  id="template-prompt"
                  data-testid="textarea-template-prompt"
                  value={newTemplate.basePrompt}
                  onChange={(e) => setNewTemplate({ ...newTemplate, basePrompt: e.target.value })}
                  placeholder="Create a superhero-style image featuring {petName} as {heroName}..."
                  rows={6}
                />
              </div>

              <Button
                onClick={handleCreateTemplate}
                disabled={createTemplateMutation.isPending}
                className="w-full"
                data-testid="button-create-template"
              >
                {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Existing Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div>Loading templates...</div>
              ) : templates.length === 0 ? (
                <div className="text-gray-500">No templates created yet.</div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template: PromptTemplate) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                      data-testid={`template-card-${template.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {template.basePrompt.substring(0, 100)}...
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            template.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Prompt Variants Management */}
        <div className="space-y-6">
          {selectedTemplate && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Variant for "{selectedTemplate.name}"
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="variant-prompt">Variant Prompt</Label>
                    <Textarea
                      id="variant-prompt"
                      data-testid="textarea-variant-prompt"
                      value={newVariant.prompt}
                      onChange={(e) => setNewVariant({ ...newVariant, prompt: e.target.value })}
                      placeholder="Enter a variation of the base prompt..."
                      rows={6}
                    />
                  </div>

                  <Button
                    onClick={handleCreateVariant}
                    disabled={createVariantMutation.isPending}
                    className="w-full"
                    data-testid="button-create-variant"
                  >
                    {createVariantMutation.isPending ? "Creating..." : "Create Variant"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {variants.length === 0 ? (
                    <div className="text-gray-500">No variants created yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {variants.map((variant: PromptVariant) => (
                        <div key={variant.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">Variant #{variant.id}</h4>
                            <div className="text-right text-sm">
                              <div>Success: {(variant.successRate * 100).toFixed(1)}%</div>
                              <div className="text-gray-500">Used: {variant.timesUsed} times</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {variant.prompt.substring(0, 150)}...
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!selectedTemplate && (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a Template</h3>
                <p className="text-gray-500">Choose a template from the left to manage its variants and view analytics.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}