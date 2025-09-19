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
          Transform Your Pet Into A{" "}
          <span className="text-brand-primary">North Carolina Legend!</span>
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

        {/* Example Gallery - Vertical Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-full max-h-96 bg-white flex items-center justify-center">
              <img
                src="/images/baseball-star.jpg"
                alt="Baseball star example"
                className="max-h-96 w-auto h-auto object-contain"
              />
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs text-gray-600 font-medium">Baseball Star</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-full max-h-96 bg-white flex items-center justify-center">
              <img
                src="/images/superhero.jpg"
                alt="Superhero example"
                className="max-h-96 w-auto h-auto object-contain"
              />
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs text-gray-600 font-medium">Superhero</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-full max-h-96 bg-white flex items-center justify-center">
              <img
                src="/images/all-star-cat.webp"
                alt="Cat transformation example"
                className="max-h-96 w-auto h-auto object-contain"
              />
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs text-gray-600 font-medium">All-Star Cat</p>
            </div>
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-full max-h-96 bg-white flex items-center justify-center">
              <img
                src="/images/raleigh-hero.jpg"
                alt="Pet family transformation example"
                className="max-h-96 w-auto h-auto object-contain"
              />
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs text-gray-600 font-medium">Team Captain</p>
            </div>
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
