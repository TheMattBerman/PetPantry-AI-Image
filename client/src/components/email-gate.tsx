import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Mail, Sparkles, Shield, CheckCircle, Star, Download, Heart, Zap } from "lucide-react";
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
    <section className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-2xl p-4 sm:p-8 mb-8 fade-in overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-accent/10 rounded-full animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-brand-primary/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-pink-200/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Exciting Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full flex items-center justify-center mx-auto shadow-lg animate-glow-pulse">
              <Gift className="text-white w-10 h-10" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center animate-bounce">
              <Star className="text-white w-4 h-4" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            🎉 Almost Ready! 
            <span className="block text-brand-primary mt-1">
              {petData.name}'s Epic Transformation Awaits
            </span>
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed">
            Just one quick step to unlock your pet's amazing {selectedTheme === 'baseball' ? 'sports card' : 'superhero identity'}!
          </p>
        </div>

        {/* Enhanced Preview Card */}
        <Card className="border-0 shadow-xl mb-8 overflow-hidden bg-gradient-to-r from-brand-accent/20 via-white to-brand-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Ready to Generate</span>
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">
                  {petData.name}'s {selectedTheme === 'baseball' ? '⚾ Sports Card' : '🦸 Superhero Identity'}
                </h4>
                <p className="text-sm text-gray-600">
                  {petData.traits.length > 0 ? (
                    <>Featuring: {petData.traits.join(', ')} ✨</>
                  ) : (
                    'Personalized just for them! ✨'
                  )}
                </p>
              </div>
              <div className="text-4xl animate-bounce">
                {selectedTheme === 'baseball' ? '🏆' : '⚡'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Friendly Email Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Email Input - Enhanced Design */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm form-card">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-6 h-6 text-brand-accent" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-lg font-semibold text-gray-800">
                    Where should we send your masterpiece?
                  </Label>
                  <p className="text-sm text-gray-500">Your email keeps your creation safe</p>
                </div>
              </div>
              
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="your.email@example.com"
                  className="text-lg p-4 border-2 border-gray-200 focus:border-brand-accent rounded-xl transition-all mobile-input pr-12"
                  disabled={isSubmitting}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Heart className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
              </div>
              
              {errors.email && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.email.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Optional Name Input */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm form-card">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <Label htmlFor="name" className="text-lg font-semibold text-gray-800">
                    What should we call you?
                  </Label>
                  <p className="text-sm text-gray-500">Optional - for a personal touch</p>
                </div>
              </div>
              
              <Input
                id="name"
                {...register('name')}
                placeholder="Your name (optional)"
                className="text-lg p-4 border-2 border-gray-200 focus:border-brand-accent rounded-xl transition-all mobile-input"
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>

          {/* Irresistible Benefits */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4 animate-pulse">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h5 className="text-xl font-bold text-gray-800">
                  🎁 What You Get (FREE!)
                </h5>
              </div>
              
              <div className="grid gap-3">
                <div className="flex items-center p-3 bg-white/80 rounded-lg transition-all hover:bg-white hover:shadow-md">
                  <Download className="text-green-500 mr-3 w-6 h-6" />
                  <div>
                    <span className="font-semibold text-gray-800">High-Resolution Download</span>
                    <p className="text-sm text-gray-600">Perfect for printing and sharing</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-white/80 rounded-lg transition-all hover:bg-white hover:shadow-md">
                  <Zap className="text-green-500 mr-3 w-6 h-6" />
                  <div>
                    <span className="font-semibold text-gray-800">Instant Social Sharing</span>
                    <p className="text-sm text-gray-600">Share your pet's transformation immediately</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-white/80 rounded-lg transition-all hover:bg-white hover:shadow-md">
                  <Sparkles className="text-green-500 mr-3 w-6 h-6" />
                  <div>
                    <span className="font-semibold text-gray-800">Future Themes & Updates</span>
                    <p className="text-sm text-gray-600">Be first to try new transformations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust & Privacy */}
          <div className="text-center p-4 bg-gray-50/80 rounded-xl">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">100% Safe & Secure</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              We respect your privacy. No spam ever. Unsubscribe anytime with one click.
            </p>
          </div>

          {/* Irresistible Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`
                w-full py-6 text-xl font-bold rounded-2xl transition-all duration-300 shadow-xl mobile-button
                ${isValid && !isSubmitting
                  ? 'bg-gradient-to-r from-brand-primary via-brand-primary-light to-brand-primary hover:from-brand-primary-light hover:to-brand-primary text-white shadow-brand-primary/25 hover:shadow-2xl transform hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  <span>Creating Your Masterpiece...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="mr-3 w-6 h-6 animate-pulse" />
                  <span>🚀 Unlock {petData.name}'s Transformation</span>
                </div>
              )}
            </Button>
            
            {!isValid && (
              <p className="text-center text-sm text-gray-500 mt-3 animate-fade-in">
                Just add your email above to unlock the magic ✨
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}