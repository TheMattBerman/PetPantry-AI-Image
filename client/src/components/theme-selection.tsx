import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Trophy, Zap, Star, Shield } from "lucide-react";
import type { Theme } from "@/lib/types";
import { useState, useRef } from "react";

interface ThemeSelectionProps {
  selectedTheme: Theme | null;
  onThemeSelected: (theme: Theme) => void;
}

interface ThemeCardProps {
  theme: Theme;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  gradient: string;
  iconColor: string;
  features: string[];
  isSelected: boolean;
  onClick: () => void;
}

function ThemeCard({ 
  theme, 
  title, 
  subtitle, 
  description, 
  icon: Icon, 
  gradient, 
  iconColor, 
  features, 
  isSelected, 
  onClick 
}: ThemeCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <Card
      ref={cardRef}
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-500 ease-out
        ${gradient} border-2 group hover:shadow-2xl
        ${isSelected 
          ? 'border-brand-accent shadow-lg scale-105 ring-4 ring-brand-accent/20' 
          : 'border-transparent hover:border-brand-accent/50'
        }
        transform hover:scale-105 hover:-translate-y-2
      `}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${(mousePos.y - 150) * 0.02}deg) rotateY(${(mousePos.x - 150) * 0.02}deg) ${isSelected ? 'scale(1.05) translateY(-8px)' : ''}`
      }}
    >
      {/* Animated background gradient */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1), transparent 40%)`
        }}
      />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-white/30 rounded-full animate-pulse ${
              theme === 'baseball' ? 'animate-bounce' : 'animate-ping'
            }`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.5}s`
            }}
          />
        ))}
      </div>

      <CardContent className="relative p-8 z-10">
        {/* Icon with enhanced animation */}
        <div className="text-center mb-6">
          <div className={`
            w-20 h-20 ${iconColor} rounded-full flex items-center justify-center mx-auto mb-4
            transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12
            shadow-lg group-hover:shadow-xl
          `}>
            <Icon className="text-white w-10 h-10 transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {subtitle}
            </div>
            <h4 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
              {title}
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
              {description}
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center space-x-3 text-sm text-gray-700 group-hover:text-gray-800 transition-colors"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                transform: `translateX(${mousePos.x * 0.01}px)`
              }}
            >
              <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center animate-pulse">
            <Shield className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Call to action */}
        <div className="mt-6 text-center">
          <div className={`
            inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold
            ${isSelected 
              ? 'bg-brand-accent text-white' 
              : 'bg-white/80 text-gray-700 group-hover:bg-brand-accent group-hover:text-white'
            }
            transition-all duration-300 transform group-hover:scale-105
          `}>
            {isSelected ? 'Selected!' : 'Choose This Style'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ThemeSelection({ selectedTheme, onThemeSelected }: ThemeSelectionProps) {
  const themes = [
    {
      theme: 'baseball' as Theme,
      title: 'Sports Star',
      subtitle: 'Trading Card',
      description: 'Transform your pet into a legendary sports trading card with professional stats and championship flair',
      icon: Trophy,
      gradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-100',
      iconColor: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      features: [
        'Professional trading card design',
        'Championship team aesthetics',
        'Athletic performance stats',
        'Hall of Fame worthy presentation'
      ]
    },
    {
      theme: 'superhero' as Theme,
      title: 'Superhero',
      subtitle: 'Comic Hero',
      description: 'Give your pet amazing superpowers and create their ultimate superhero identity with comic book style',
      icon: Zap,
      gradient: 'bg-gradient-to-br from-purple-50 via-pink-50 to-red-100',
      iconColor: 'bg-gradient-to-br from-purple-500 to-pink-600',
      features: [
        'Epic superhero transformation',
        'Comic book art style',
        'Incredible superpowers',
        'Heroic origin story ready'
      ]
    }
  ];

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-brand-accent/10 rounded-full text-brand-accent text-sm font-semibold mb-4">
            <Star className="w-4 h-4 mr-2" />
            Step 2 of 4
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Choose Your Pet's <span className="text-brand-primary">Transformation</span>
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Pick the perfect style to showcase your pet's unique personality and create something truly amazing
          </p>
        </div>

        {/* Theme cards with enhanced grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {themes.map((themeData) => (
            <ThemeCard
              key={themeData.theme}
              {...themeData}
              isSelected={selectedTheme === themeData.theme}
              onClick={() => onThemeSelected(themeData.theme)}
            />
          ))}
        </div>

        {/* Continue button with enhanced styling */}
        <div className="text-center">
          <Button
            disabled={!selectedTheme}
            size="lg"
            className={`
              px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300
              ${selectedTheme 
                ? 'bg-brand-primary hover:bg-brand-primary-light text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {selectedTheme ? 'Continue to Customize' : 'Select a Style to Continue'}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          {selectedTheme && (
            <p className="text-sm text-gray-500 mt-3 animate-fade-in">
              Great choice! Let's customize your {selectedTheme === 'baseball' ? 'Sports Star' : 'Superhero'} transformation
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
