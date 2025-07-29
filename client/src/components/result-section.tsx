import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Facebook, Twitter, Instagram, Link2, Trophy, Users, Plus, Heart, Share2, Download as DownloadIcon, Star, Zap, Award, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TransformationResult, PetData } from "@/lib/types";

interface ResultSectionProps {
  transformationResult: TransformationResult;
  petData: PetData;
  userEmail: string;
  onCreateAnother: () => void;
}

export default function ResultSection({ transformationResult, petData, userEmail, onCreateAnother }: ResultSectionProps) {
  const { toast } = useToast();

  // Generate theme-appropriate fun facts and quotes
  const generateFunFacts = () => {
    const isBaseball = transformationResult.theme === 'baseball';
    const petName = petData.name;
    const breed = petData.breed;
    const traits = petData.traits || [];

    if (isBaseball) {
      return {
        stats: [
          {
            icon: <Target className="w-5 h-5 text-blue-500" />,
            label: "Batting Average",
            value: ".987",
            description: "Perfect treats-per-swing ratio"
          },
          {
            icon: <Award className="w-5 h-5 text-green-500" />,
            label: "Home Runs",
            value: "142",
            description: "Ball-chasing victories this season"
          },
          {
            icon: <Star className="w-5 h-5 text-yellow-500" />,
            label: "MVP Rating",
            value: "★★★★★",
            description: "Most Valuable Pet award winner"
          }
        ],
        quote: traits.includes('Playful') 
          ? `"${petName} brings the same energy to fetch that legends bring to the World Series!"`
          : traits.includes('Loyal') 
          ? `"Like the greatest teammates, ${petName} never leaves anyone behind!"`
          : traits.includes('Smart') 
          ? `"${petName}'s baseball IQ is off the charts - always knows where the ball will land!"`
          : `"${petName} has that champion spirit that makes every day feel like the playoffs!"`,
        funFact: breed === 'Golden Retriever' 
          ? `Golden Retrievers like ${petName} were originally bred to retrieve waterfowl - making them natural outfielders!`
          : breed === 'Border Collie'
          ? `Border Collies like ${petName} have the intelligence to understand complex plays better than most rookie players!`
          : breed === 'Labrador'
          ? `Labradors like ${petName} have the stamina to play all 9 innings and still want extra rounds!`
          : `${breed}s like ${petName} bring their own unique playing style to the diamond!`
      };
    } else {
      // Superhero theme
      return {
        stats: [
          {
            icon: <Zap className="w-5 h-5 text-purple-500" />,
            label: "Power Level",
            value: "9,001",
            description: "Over maximum cuteness capacity"
          },
          {
            icon: <Award className="w-5 h-5 text-red-500" />,
            label: "Rescues",
            value: "847",
            description: "Hearts saved from sadness"
          },
          {
            icon: <Star className="w-5 h-5 text-blue-500" />,
            label: "Hero Rating",
            value: "LEGENDARY",
            description: "Top tier defender of the household"
          }
        ],
        quote: traits.includes('Brave') 
          ? `"With great paws comes great responsibility - and ${petName} takes that seriously!"`
          : traits.includes('Protective') 
          ? `"${petName} guards their family with the dedication of a true superhero!"`
          : traits.includes('Energetic') 
          ? `"Faster than a speeding squirrel, more powerful than a vacuum cleaner - it's ${petName}!"`
          : `"Every neighborhood needs a hero like ${petName} - defender of treats and belly rubs!"`,
        funFact: breed === 'German Shepherd' 
          ? `German Shepherds like ${petName} have been real-life heroes in police and military work for over 100 years!`
          : breed === 'Husky'
          ? `Huskies like ${petName} have the endurance to run over 100 miles a day - true superhero stamina!`
          : breed === 'Rottweiler'
          ? `Rottweilers like ${petName} were originally bred to drive cattle - they've always been protectors!`
          : `${breed}s like ${petName} have their own special superpowers that make them amazing companions!`
      };
    }
  };

  const funFacts = generateFunFacts();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const shareText = `Check out my pet ${petData.name}'s amazing transformation! 🐾`;
    const shareUrl = window.location.href;
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Content copied!",
          description: "Share text copied to clipboard. Paste it in your Instagram post!",
        });
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 mb-8 fade-in">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Your Pet's Transformation is Ready!
        </h3>
        <p className="text-gray-600 text-center mb-8">
          Look at this amazing creation! Ready to share with the world?
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Generated Image */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6 mb-4">
              <img
                src={transformationResult.transformedImageUrl}
                alt={`${petData.name}'s transformation`}
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            {/* AI-Generated Fun Stats */}
            <div className="space-y-4">
              {/* Theme Stats */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800 mb-2">
                      {transformationResult.theme === 'baseball' ? '⚾ Player Stats' : '🦸 Hero Stats'}
                    </h4>
                    <p className="text-sm text-gray-600">AI-generated based on {petData.name}'s traits</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {funFacts.stats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/80 rounded-lg hover:bg-white transition-all">
                        <div className="flex items-center">
                          {stat.icon}
                          <div className="ml-3">
                            <div className="font-semibold text-gray-800">{stat.label}</div>
                            <div className="text-xs text-gray-500">{stat.description}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-brand-primary">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Inspirational Quote */}
              <Card className="bg-gradient-to-br from-brand-accent/10 to-brand-primary/10 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">💭</div>
                  <blockquote className="text-lg font-medium text-gray-800 italic mb-3 leading-relaxed">
                    {funFacts.quote}
                  </blockquote>
                  <div className="text-sm text-gray-600">
                    - AI Coach's Analysis
                  </div>
                </CardContent>
              </Card>

              {/* Fun Fact */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="text-2xl mr-4">🧠</div>
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Did You Know?</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {funFacts.funFact}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Stats */}
              <Card className="bg-gray-50 border-0">
                <CardContent className="p-4">
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-accent flex items-center justify-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {transformationResult.stats.likes}
                      </div>
                      <div className="text-gray-600">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-500 flex items-center justify-center">
                        <Share2 className="w-4 h-4 mr-1" />
                        {transformationResult.stats.shares}
                      </div>
                      <div className="text-gray-600">Shares</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-500 flex items-center justify-center">
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        {transformationResult.stats.downloads}
                      </div>
                      <div className="text-gray-600">Downloads</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Download Section */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Download className="text-white w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2">Your Image is Ready!</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    High-resolution version sent to: <strong>{userEmail}</strong>
                  </p>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => toast({
                      title: "Download Starting",
                      description: "Your high-resolution image is downloading now.",
                    })}
                  >
                    <Download className="mr-2 w-4 h-4" />
                    Download High-Res Image
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Social Sharing */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Share Your Pet's Transformation</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleSocialShare('facebook')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  onClick={() => handleSocialShare('twitter')}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  onClick={() => handleSocialShare('instagram')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
                <Button
                  onClick={handleCopyLink}
                  variant="secondary"
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>

            {/* Viral Mechanics */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <Trophy className="text-green-500 mr-2 w-5 h-5" />
                  Challenge Your Friends!
                </h5>
                <p className="text-sm text-gray-600 mb-3">
                  Think your pet is the cutest? Challenge 3 friends to create their pet's card and see who gets the most shares!
                </p>
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                  <Users className="mr-1 w-4 h-4" />
                  Send Challenge
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Another Button */}
        <div className="text-center mt-8">
          <Button
            onClick={onCreateAnother}
            size="lg"
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            <Plus className="mr-2 w-5 h-5" />
            Create Another Transformation
          </Button>
        </div>
      </div>
    </section>
  );
}
