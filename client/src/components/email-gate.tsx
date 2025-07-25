import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, Sparkles, Shield, CheckCircle } from "lucide-react";
import type { PetData, Theme } from "@/lib/types";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

interface EmailGateProps {
  petData: PetData;
  selectedTheme: Theme;
  onEmailSubmit: (email: string) => void;
}

export default function EmailGate({ petData, selectedTheme, onEmailSubmit }: EmailGateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<{ email: string; name?: string }>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
  });

  const onFormSubmit = async (data: { email: string; name?: string }) => {
    setIsSubmitting(true);
    
    // Simulate brief validation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onEmailSubmit(data.email);
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Unlock Your Pet's Transformation
          </h3>
          <p className="text-gray-600">
            We're about to create {petData.name}'s amazing {selectedTheme} transformation! 
            Enter your email below to unlock your high-resolution result.
          </p>
        </div>

        {/* Preview Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">
                  {petData.name}'s {selectedTheme === 'baseball' ? 'Baseball Card' : 'Superhero Identity'}
                </h4>
                <p className="text-sm text-gray-600">
                  {petData.traits.length > 0 && (
                    <>Featuring: {petData.traits.join(', ')}</>
                  )}
                </p>
              </div>
              <Sparkles className="text-orange-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        {/* Email Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-800">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter your email address"
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-800">
              Your Name (Optional)
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter your name"
              className="mt-2"
              disabled={isSubmitting}
            />
          </div>

          {/* Benefits List */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Shield className="text-green-500 mr-2 w-5 h-5" />
                What you'll get:
              </h5>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 w-4 h-4" />
                  High-resolution transformation image
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 w-4 h-4" />
                  Instant download and sharing options
                </div>
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2 w-4 h-4" />
                  Future updates on new themes and features
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 text-center">
            We respect your privacy. Your email will only be used to send your transformation 
            and occasional updates about The Pet Pantry. No spam, unsubscribe anytime.
          </p>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-5 h-5" />
                  Unlock My Pet's Transformation
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}