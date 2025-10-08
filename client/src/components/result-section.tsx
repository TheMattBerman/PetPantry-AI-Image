import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/success-modal";
import { Download, Facebook, Twitter, Instagram, Link2, Trophy, Users, Plus, Heart, Share, Share2, Download as DownloadIcon, Star, Zap, Award, Target, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TransformationResult, PetData, Theme, PersonaContent } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ShareCapableNavigator = Navigator & {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
};

interface ResultSectionProps {
  transformationResult: TransformationResult;
  petData: PetData;
  selectedTheme: Theme;
  userEmail: string;
  onCreateAnother: () => void;
}

export default function ResultSection({ transformationResult, petData, selectedTheme, userEmail, onCreateAnother }: ResultSectionProps) {
  const { toast } = useToast();
  const [persona, setPersona] = useState<PersonaContent | null>(null);
  const [loadingPersona, setLoadingPersona] = useState(false);
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [smsPhoneNumber, setSmsPhoneNumber] = useState("");
  const [smsError, setSmsError] = useState<string | null>(null);
  const [isDownloadPending, setIsDownloadPending] = useState(false);
  const [isDownloadRecorded, setIsDownloadRecorded] = useState(false);
  const [isShareRecording, setIsShareRecording] = useState(false);
  const [directDownloadUrl, setDirectDownloadUrl] = useState<string | null>(null);
  const [directDownloadError, setDirectDownloadError] = useState<string | null>(null);

  const SHARE_SITE_URL = 'https://transform.thepetpantry.com';

  const platformHandles: Record<string, string> = {
    facebook: '@FeedYourPetscom',
    twitter: '@FeedYourPetsCom',
    instagram: '@thepetpantrync',
    default: '@thepetpantrync',
  };

  const buildShareCaption = (platform?: string) => {
    const platformHandle = platformHandles[platform ?? 'default'] || platformHandles.default;
    const themeHighlight = selectedTheme === 'baseball' ? 'a legendary baseball all-star ⚾' : 'an epic superhero 🦸‍♂️';
    const baseText = `🎉 Meet ${petData.name}! Now ${themeHighlight}!`;
    const challengeLine = 'I dare you to make your pet a legend!';
    const callout = `${platformHandle} ${SHARE_SITE_URL}`;
    const caption = `${baseText}\n${challengeLine}\n${callout}`;

    return {
      caption,
      platformHandle,
      baseText,
      challengeLine,
      callout,
    };
  };

  // Fetch persona stats/content from backend; fallback to local copy if unavailable
  useEffect(() => {
    const fetchPersona = async () => {
      try {
        setLoadingPersona(true);
        const res = await fetch('/api/persona-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petName: petData.name,
            breed: petData.breed,
            traits: petData.traits || [],
            theme: selectedTheme,
          }),
        });
        const data = await res.json();
        if (data?.success && data?.content) {
          setPersona(data.content as PersonaContent);
        }
      } catch (e) {
        // silent fallback
      } finally {
        setLoadingPersona(false);
      }
    };
    fetchPersona();
  }, [petData.name, petData.breed, selectedTheme, JSON.stringify(petData.traits)]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nav = window.navigator as ShareCapableNavigator;
    if (typeof nav.share === 'function') {
      setNativeShareAvailable(true);
    }
  }, []);

  const validatePhoneNumber = (value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const normalized = trimmed.replace(/[^0-9+]/g, '');
    const e164Regex = /^\+?[1-9]\d{7,14}$/;

    if (!e164Regex.test(normalized)) {
      return 'Use format like +12345556789';
    }

    return null;
  };

  const smsMessage = useMemo(() => {
    const { caption } = buildShareCaption();
    if (typeof window === 'undefined') {
      return caption;
    }
    return `${caption}\n\nCreate your pet's transformation here: ${window.location.href}`;
  }, [buildShareCaption]);

  // Local fallback content
  const generateFunFacts = () => {
    const isBaseball = selectedTheme === 'baseball';
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

  const funFacts = persona
    ? {
      stats: (persona.stats || []).slice(0, 3).map((s) => ({
        icon: <Star className="w-5 h-5 text-yellow-500" />,
        label: s.label,
        value: typeof s.value === 'number' ? String(s.value) : s.value,
        description: s.blurb,
      })),
      quote: persona.catchphrase || generateFunFacts().quote,
      funFact: persona.origin || generateFunFacts().funFact,
    }
    : generateFunFacts();

  const recordShare = useCallback(async () => {
    if (isShareRecording || !transformationResult?.id) {
      return;
    }

    try {
      setIsShareRecording(true);
      const response = await fetch(`/api/transformations/${transformationResult.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to record share: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to record share', error);
    } finally {
      setIsShareRecording(false);
    }
  }, [isShareRecording, transformationResult?.id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });
      await recordShare();
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = async (platform: string) => {
    const shareUrl = window.location.href;
    const imageUrl = transformationResult.transformedImageUrl;

    const { caption: enhancedShareText } = buildShareCaption(platform);

    let url = '';
    switch (platform) {
      case 'facebook':
        // Facebook Open Graph will automatically pull image from URL
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(enhancedShareText)}`;
        break;
      case 'twitter':
        // Twitter/X will show image preview from URL
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(enhancedShareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // For Instagram, copy enhanced text with instructions to save image
        const instagramText = `${enhancedShareText}\n\n📱 Tip: Save the image from ${shareUrl} and post it with this caption!`;
        try {
          await navigator.clipboard.writeText(instagramText);
          toast({
            title: "Instagram content ready!",
            description: "Caption copied! Visit the link to save your image, then paste this caption in Instagram.",
          });
        } catch (err) {
          toast({
            title: "Content ready!",
            description: "Visit the link to save your image for Instagram sharing.",
          });
        }
        return;
      case 'download-share':
        // Special case for downloading image with share text
        try {
          await navigator.clipboard.writeText(enhancedShareText);
        } catch (err) {
          toast({
            title: "Caption copy failed",
            description: "We'll still download the image for you.",
            variant: "destructive",
          });
        }

        if (imageUrl) {
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `${petData.name}-${selectedTheme}-transformation.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        toast({
          title: "Download & Share Ready!",
          description: "Image downloaded. Caption copied if your browser allowed it.",
        });
        await recordShare();
        return;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
      toast({
        title: "Share window opened!",
        description: "Your post will include the image and branded caption.",
      });
      await recordShare();
    }
  };

  const handleNativeShare = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const nav = window.navigator as ShareCapableNavigator;

    if (typeof nav.share !== 'function') {
      toast({
        title: "Share sheet unavailable",
        description: "Your device browser doesn't support native sharing.",
        variant: "destructive",
      });
      return;
    }

    const { caption } = buildShareCaption();
    const shareTitle = `${petData.name} is a legend!`;
    const imageUrl = transformationResult.transformedImageUrl;

    let files: File[] | undefined;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image for sharing');
      }
      const blob = await response.blob();

      if (blob.size > 0) {
        const fileType = blob.type || 'image/jpeg';
        const extension = fileType.includes('/') ? fileType.split('/')[1] : 'jpg';
        const fileName = `${petData.name}-${selectedTheme}-legend.${extension}`;
        const candidateFiles = [new File([blob], fileName, { type: fileType })];

        if (!nav.canShare || nav.canShare({ files: candidateFiles })) {
          files = candidateFiles;
        }
      }
    } catch {
      files = undefined;
    }

    try {
      await nav.share(
        files
          ? { title: shareTitle, text: caption, files }
          : { title: shareTitle, text: caption }
      );

      toast({
        title: "Share sheet opened!",
        description: files
          ? "Your device is ready to share the image and caption."
          : "Your device is ready to share the caption.",
      });
      await recordShare();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await navigator.clipboard.writeText(caption);
        toast({
          title: "Copied caption instead",
          description: "Native share failed. Caption copied to your clipboard.",
        });
        await recordShare();
      } catch {
        toast({
          title: "Sharing failed",
          description: "We couldn't open the share sheet on this device.",
          variant: "destructive",
        });
      }
    }
  };

  const triggerDirectDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    const suffix = url.split('.').pop()?.split('?')[0] || 'jpg';
    link.download = `${petData.name}-${selectedTheme}-high-res.${suffix}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadHighRes = async () => {
    if (isDownloadPending || isDownloadRecorded) {
      if (directDownloadUrl) {
        triggerDirectDownload(directDownloadUrl);
      }
      setIsSuccessModalOpen(true);
      return;
    }

    if (!transformationResult?.id) {
      toast({
        title: "Missing transformation",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDownloadPending(true);
      setDirectDownloadError(null);

      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          transformationId: transformationResult.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email capture failed: ${response.status}`);
      }

      const data = await response.json();
      if (data?.imageUrl) {
        setDirectDownloadUrl(data.imageUrl);
        triggerDirectDownload(data.imageUrl);
      }

      setIsDownloadRecorded(true);
      setIsSuccessModalOpen(true);
      toast({
        title: "Download started",
        description: "Check your inbox for the high-res image!",
      });
    } catch (error) {
      console.error('Failed to trigger email capture', error);
      setDirectDownloadError('We could not start the download automatically. Please try again later.');
      toast({
        title: "Download failed",
        description: "We couldn't send the high-res image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadPending(false);
    }
  };

  const handleSmsShare = async () => {
    const copyMessageToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(smsMessage);
        toast({
          title: "Text ready!",
          description: "Message copied. Paste it into your SMS app.",
        });
        await recordShare();
        setIsSmsDialogOpen(false);
      } catch (error) {
        console.error('Failed to copy SMS message', error);
        toast({
          title: "Copy failed",
          description: "We couldn't copy the message. Try manually copying it.",
          variant: "destructive",
        });
      }
    };

    if (smsPhoneNumber.trim()) {
      const validationError = validatePhoneNumber(smsPhoneNumber);
      if (validationError) {
        setSmsError(validationError);
        return;
      }
    }

    await copyMessageToClipboard();
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
                      {selectedTheme === 'baseball' ? '⚾ Player Stats' : '🦸 Hero Stats'}
                    </h4>
                    <p className="text-sm text-gray-600">{loadingPersona ? 'Generating personalized stats…' : `AI-generated based on ${petData.name}'s traits`}</p>
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
                  {directDownloadError && (
                    <p className="text-xs text-red-500 mb-4">
                      {directDownloadError}
                    </p>
                  )}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleDownloadHighRes}
                    disabled={isDownloadPending}
                  >
                    {isDownloadPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Sending to your email…
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 w-4 h-4" />
                        Download High-Res Image
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Download & Share Special Button */}
            <Card className="bg-gradient-to-r from-brand-accent/20 to-brand-primary/20 border-0 shadow-lg mb-6">
              <CardContent className="p-4">
                <div className="text-center">
                  <h4 className="font-bold text-gray-800 mb-2">📱 Perfect for Social Media</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Download image + get pre-written caption ready to post!
                  </p>
                  <Button
                    onClick={() => handleSocialShare('download-share')}
                    className="w-full bg-gradient-to-r from-brand-primary to-brand-primary-light hover:from-brand-primary-light hover:to-brand-primary text-white font-semibold py-3"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Image + Copy Caption
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Social Sharing */}
            <div>
              <h4 className="font-bold text-gray-800 mb-4">Share Directly to Social Media</h4>
              <p className="text-sm text-gray-500 mb-4">
                These buttons will pre-load your image and caption for easy sharing
              </p>
              <div className="grid grid-cols-2 gap-3">
                {nativeShareAvailable && (
                  <Button
                    onClick={handleNativeShare}
                    className="bg-brand-primary text-white hover:bg-brand-primary/90"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share via Device
                  </Button>
                )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700"
                  onClick={() => {
                    setSmsError(null);
                    setIsSmsDialogOpen(true);
                  }}
                >
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
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        downloadUrl={directDownloadUrl}
        onDownload={directDownloadUrl ? () => triggerDirectDownload(directDownloadUrl) : undefined}
        downloadError={directDownloadError}
      />

      <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Challenge Your Friends</DialogTitle>
            <DialogDescription>
              Copy this text and send it via SMS to invite your friends to transform their pets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="smsPhone" className="text-sm font-medium text-gray-700">
                Friend's phone (optional)
              </Label>
              <Input
                id="smsPhone"
                placeholder="+12345556789"
                value={smsPhoneNumber}
                onChange={(event) => {
                  setSmsError(null);
                  setSmsPhoneNumber(event.target.value);
                }}
                aria-invalid={Boolean(smsError)}
              />
              {smsError && (
                <p className="text-xs text-red-500 mt-1">{smsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="smsMessage" className="text-sm font-medium text-gray-700">
                Message preview
              </Label>
              <Textarea id="smsMessage" value={smsMessage} readOnly className="text-sm" rows={4} />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(smsMessage);
                  toast({
                    title: "Message copied",
                    description: "Paste it into your SMS app.",
                  });
                } catch (error) {
                  toast({
                    title: "Copy failed",
                    description: "We couldn't copy the message automatically.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Copy Message
            </Button>
            <Button onClick={handleSmsShare}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Ready to Text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
