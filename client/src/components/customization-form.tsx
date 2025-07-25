import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Heart, Star, Zap, Award, Shield, Crown } from "lucide-react";
import type { Theme, PetData } from "@/lib/types";

const petSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  breed: z.string().optional(),
  traits: z.array(z.string()).max(3, "Please select up to 3 traits"),
  customMessage: z.string().optional(),
});

interface CustomizationFormProps {
  selectedTheme: Theme;
  onSubmit: (petData: PetData) => void;
}

const TRAITS = [
  { name: 'playful', icon: Heart, color: 'bg-pink-100 text-pink-600', emoji: '🎾' },
  { name: 'loyal', icon: Shield, color: 'bg-blue-100 text-blue-600', emoji: '💙' },
  { name: 'energetic', icon: Zap, color: 'bg-yellow-100 text-yellow-600', emoji: '⚡' },
  { name: 'gentle', icon: Star, color: 'bg-green-100 text-green-600', emoji: '🌟' },
  { name: 'brave', icon: Award, color: 'bg-orange-100 text-orange-600', emoji: '🦁' },
  { name: 'cuddly', icon: Crown, color: 'bg-purple-100 text-purple-600', emoji: '🤗' },
];

const BREEDS = [
  { value: 'golden-retriever', label: 'Golden Retriever' },
  { value: 'labrador', label: 'Labrador' },
  { value: 'german-shepherd', label: 'German Shepherd' },
  { value: 'bulldog', label: 'Bulldog' },
  { value: 'poodle', label: 'Poodle' },
  { value: 'cat-persian', label: 'Persian Cat' },
  { value: 'cat-siamese', label: 'Siamese Cat' },
  { value: 'cat-maine-coon', label: 'Maine Coon' },
  { value: 'other', label: 'Other' },
];

export default function CustomizationForm({ selectedTheme, onSubmit }: CustomizationFormProps) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<PetData>({
    resolver: zodResolver(petSchema),
    mode: 'onChange',
  });

  const handleTraitChange = (traitName: string, checked: boolean) => {
    let newTraits: string[];
    if (checked) {
      if (selectedTraits.length < 3) {
        newTraits = [...selectedTraits, traitName];
      } else {
        return; // Don't add if already at limit
      }
    } else {
      newTraits = selectedTraits.filter(t => t !== traitName);
    }
    setSelectedTraits(newTraits);
    setValue('traits', newTraits);
  };

  const onFormSubmit = (data: PetData) => {
    onSubmit({
      ...data,
      traits: selectedTraits,
    });
  };

  return (
    <section className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-4 sm:p-8 mb-8 fade-in">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-brand-accent/10 rounded-full text-brand-accent text-sm font-semibold mb-4">
            <Star className="w-4 h-4 mr-2" />
            Step 3 of 4
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            Tell Us About <span className="text-brand-primary">Your Pet</span>
          </h3>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Just a few details to create the perfect {selectedTheme === 'baseball' ? 'sports card' : 'superhero identity'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {/* Pet Name - Enhanced Card Style */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center mr-3">
                  <Heart className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <Label htmlFor="name" className="text-lg font-semibold text-gray-800">
                    What's your pet's name?
                  </Label>
                  <p className="text-sm text-gray-500">This will appear on their card</p>
                </div>
              </div>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter your pet's name"
                className="text-lg p-4 border-2 border-gray-200 focus:border-brand-accent rounded-xl transition-all"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-2 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.name.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pet Breed - Enhanced Card Style */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center mr-3">
                  <Crown className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-gray-800">
                    What breed are they?
                  </Label>
                  <p className="text-sm text-gray-500">Optional - helps us customize better</p>
                </div>
              </div>
              <Select onValueChange={(value) => setValue('breed', value)}>
                <SelectTrigger className="text-lg p-4 border-2 border-gray-200 focus:border-brand-accent rounded-xl transition-all">
                  <SelectValue placeholder="Choose breed or skip" />
                </SelectTrigger>
                <SelectContent>
                  {BREEDS.map((breed) => (
                    <SelectItem key={breed.value} value={breed.value}>
                      {breed.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Personality Traits - Mobile-First Design */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <Label className="text-lg font-semibold text-gray-800">
                    Pick their personality
                  </Label>
                  <p className="text-sm text-gray-500">Choose up to 3 that fit best</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {TRAITS.map((trait) => {
                  const isSelected = selectedTraits.includes(trait.name);
                  const isDisabled = !isSelected && selectedTraits.length >= 3;
                  
                  return (
                    <div
                      key={trait.name}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                        ${isSelected 
                          ? 'border-brand-accent bg-brand-accent/5 shadow-md transform scale-105' 
                          : isDisabled 
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-brand-accent/50 hover:bg-brand-accent/5'
                        }
                      `}
                      onClick={() => !isDisabled && handleTraitChange(trait.name, !isSelected)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${trait.color}`}>
                            <span className="text-xl">{trait.emoji}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 capitalize text-lg">
                              {trait.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                          ${isSelected 
                            ? 'border-brand-accent bg-brand-accent' 
                            : 'border-gray-300'
                          }
                        `}>
                          {isSelected && (
                            <div className="w-3 h-3 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700 font-medium">
                  {selectedTraits.length}/3 traits selected
                </span>
                {selectedTraits.length >= 3 && (
                  <span className="text-xs text-blue-600">Maximum reached!</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Message - Enhanced */}
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Star className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="customMessage" className="text-lg font-semibold text-gray-800">
                    Add a special message
                  </Label>
                  <p className="text-sm text-gray-500">Optional - make it extra personal</p>
                </div>
              </div>
              <Textarea
                id="customMessage"
                {...register('customMessage')}
                placeholder="e.g., 'The goodest boy in the neighborhood!' or 'Defender of treats everywhere!'"
                rows={3}
                className="text-base p-4 border-2 border-gray-200 focus:border-brand-accent rounded-xl resize-none transition-all"
              />
            </CardContent>
          </Card>

          {/* Submit Button - Enhanced Mobile */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isValid}
              className={`
                w-full py-6 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg
                ${isValid 
                  ? 'bg-gradient-to-r from-brand-primary to-brand-primary-light hover:from-brand-primary-light hover:to-brand-primary text-white shadow-brand-primary/25 hover:shadow-xl transform hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Sparkles className="mr-3 w-6 h-6" />
              Create My Pet's {selectedTheme === 'baseball' ? 'Sports Card' : 'Superhero Identity'}
            </Button>
            
            {!isValid && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Please enter your pet's name to continue
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
