import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Volleyball, Zap } from "lucide-react";
import type { Theme } from "@/lib/types";

interface ThemeSelectionProps {
  selectedTheme: Theme | null;
  onThemeSelected: (theme: Theme) => void;
}

export default function ThemeSelection({ selectedTheme, onThemeSelected }: ThemeSelectionProps) {
  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Step 2: Choose Your Theme
        </h3>
        <p className="text-gray-600 text-center mb-8">
          Pick the perfect style to showcase your pet's personality
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Volleyball Card Theme */}
          <Card
            className={`theme-card bg-gradient-to-br from-blue-50 to-indigo-100 border-2 cursor-pointer ${
              selectedTheme === 'baseball' ? 'selected' : 'border-transparent'
            }`}
            onClick={() => onThemeSelected('baseball')}
          >
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Volleyball className="text-white text-2xl w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Volleyball Card</h4>
                <p className="text-gray-600 text-sm">
                  Transform your pet into a trading card star with custom stats
                </p>
              </div>

              {/* Volleyball themed examples */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                  alt="Dog with baseball gear"
                  className="rounded-lg h-20 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1558788353-f76d92427f16?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                  alt="Pet baseball player"
                  className="rounded-lg h-20 object-cover"
                />
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Fetch Success Rate:</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Good Boy Points:</span>
                    <span className="font-medium">9.8/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Treats Per Game:</span>
                    <span className="font-medium">12.4</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Superhero Theme */}
          <Card
            className={`theme-card bg-gradient-to-br from-purple-50 to-pink-100 border-2 cursor-pointer ${
              selectedTheme === 'superhero' ? 'selected' : 'border-transparent'
            }`}
            onClick={() => onThemeSelected('superhero')}
          >
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="text-white text-2xl w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Superhero</h4>
                <p className="text-gray-600 text-sm">
                  Give your pet superpowers with cape, mask, and heroic stats
                </p>
              </div>

              {/* Superhero themed examples */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1571566882372-1598d88abd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"
                  alt="Dog superhero costume"
                  className="rounded-lg h-20 object-cover"
                />
                <img
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
                  alt="Cat in superhero outfit"
                  className="rounded-lg h-20 object-cover"
                />
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Super Speed:</span>
                    <span className="font-medium">⚡⚡⚡⚡⚡</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Loyalty Power:</span>
                    <span className="font-medium">💖💖💖💖💖</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuteness Level:</span>
                    <span className="font-medium">Over 9000!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            disabled={!selectedTheme}
            size="lg"
            className="brand-button disabled:opacity-50"
          >
            Continue to Customize
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
