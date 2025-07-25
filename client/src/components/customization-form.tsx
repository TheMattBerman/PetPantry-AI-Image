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
import { Sparkles } from "lucide-react";
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
  'playful',
  'loyal',
  'energetic',
  'gentle',
  'brave',
  'cuddly',
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

  const handleTraitChange = (trait: string, checked: boolean) => {
    let newTraits: string[];
    if (checked) {
      if (selectedTraits.length < 3) {
        newTraits = [...selectedTraits, trait];
      } else {
        return; // Don't add if already at limit
      }
    } else {
      newTraits = selectedTraits.filter(t => t !== trait);
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
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Step 3: Customize Your Pet's Details
        </h3>
        <p className="text-gray-600 text-center mb-8">
          Tell us about your furry friend to create the perfect transformation
        </p>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Pet Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-800">
              Pet's Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter your pet's name"
              className="mt-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Pet Breed */}
          <div>
            <Label htmlFor="breed" className="text-sm font-medium text-gray-800">
              Breed (Optional)
            </Label>
            <Select onValueChange={(value) => setValue('breed', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select breed" />
              </SelectTrigger>
              <SelectContent>
                {BREEDS.map((breed) => (
                  <SelectItem key={breed.value} value={breed.value}>
                    {breed.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personality Traits */}
          <div>
            <Label className="text-sm font-medium text-gray-800 mb-3 block">
              Personality Traits (Select up to 3)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {TRAITS.map((trait) => (
                <div key={trait} className="flex items-center space-x-2">
                  <Checkbox
                    id={trait}
                    checked={selectedTraits.includes(trait)}
                    onCheckedChange={(checked) => handleTraitChange(trait, checked as boolean)}
                    disabled={!selectedTraits.includes(trait) && selectedTraits.length >= 3}
                  />
                  <Label htmlFor={trait} className="text-sm capitalize cursor-pointer">
                    {trait}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTraits.length >= 3 && (
              <p className="text-sm text-gray-600 mt-2">Maximum of 3 traits selected</p>
            )}
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="customMessage" className="text-sm font-medium text-gray-800">
              Custom Message (Optional)
            </Label>
            <Textarea
              id="customMessage"
              {...register('customMessage')}
              placeholder="Add a special message for your pet's card..."
              rows={3}
              className="mt-2 resize-none"
            />
          </div>

          <div className="text-center">
            <Button
              type="submit"
              disabled={!isValid}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 disabled:opacity-50"
            >
              <Sparkles className="mr-2 w-5 h-5" />
              Generate My Pet's {selectedTheme === 'baseball' ? 'Card' : 'Hero'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
