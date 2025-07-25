import { Button } from "@/components/ui/button";
import { Wand2, Users, Share2 } from "lucide-react";

interface HeroSectionProps {
  onStart: () => void;
}

export default function HeroSection({ onStart }: HeroSectionProps) {
  return (
    <section className="text-center mb-12 fade-in" id="hero-section">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          Transform Your Pet Into An{" "}
          <span className="text-brand-primary">All-Star!</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Turn your furry friend into a baseball legend or superhero with our AI-powered transformation tool.
          Create shareable content that will make your pet the star they deserve to be!
        </p>

        {/* Social Proof */}
        <div className="flex items-center justify-center space-x-8 mb-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Users className="text-blue-500" />
            <span className="font-semibold">25,847</span>
            <span>pets transformed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Share2 className="text-green-500" />
            <span className="font-semibold">89,234</span>
            <span>shares</span>
          </div>
        </div>

        {/* Example Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg overflow-hidden shadow-md">
            <img
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
              alt="Happy dog with owner"
              className="w-full h-32 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <img
              src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
              alt="Dog with baseball"
              className="w-full h-32 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <img
              src="https://images.unsplash.com/photo-1558788353-f76d92427f16?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
              alt="Pet in costume"
              className="w-full h-32 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <img
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
              alt="Happy pet family"
              className="w-full h-32 object-cover"
            />
          </div>
        </div>

        <Button
          onClick={onStart}
          size="lg"
          className="brand-button px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
        >
          <Wand2 className="mr-2" />
          Transform Your Pet Now
        </Button>
      </div>
    </section>
  );
}
