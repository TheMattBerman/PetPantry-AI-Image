import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SuccessModal from "@/components/success-modal";
import { Download, Facebook, Twitter, Instagram, Link2, Trophy, Users, Plus, Heart, Share, Share2, Download as DownloadIcon, Star, Zap, Award, Target, MessageCircle, Loader2, Flame, Shield, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TransformationResult, PetData, Theme, PersonaContent } from "@/lib/types";
import type { ReactNode } from "react";
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

type SeededRandom = () => number;

interface FunFactContext {
  random: SeededRandom;
  petName: string;
  breed?: string;
  traits: string[];
}

interface FunFactStatDefinition {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}

interface FunFactFallback {
  stats: FunFactStatDefinition[];
  quote: string;
  funFact: string;
}

interface BreedTemplate {
  matches: string[];
  templates: string[];
}

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const createSeededRandom = (seed: string): SeededRandom => {
  let state = hashString(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
};

const randomInt = (random: SeededRandom, min: number, max: number): number => {
  return Math.floor(random() * (max - min + 1)) + min;
};

const pickOne = <T,>(random: SeededRandom, items: T[]): T => {
  if (items.length === 0) {
    throw new Error("Cannot pick from empty array");
  }
  const index = Math.floor(random() * items.length);
  return items[index];
};

const pickMany = <T,>(random: SeededRandom, items: T[], count: number): T[] => {
  const pool = [...items];
  const selections: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = Math.floor(random() * pool.length);
    selections.push(pool.splice(index, 1)[0]);
  }
  return selections;
};

const formatTemplate = (template: string, ctx: FunFactContext): string => {
  const breedText = ctx.breed ?? "pet";
  return template
    .replace(/\{name\}/g, ctx.petName)
    .replace(/\{breed\}/g, breedText)
    .replace(/\{breedOrPet\}/g, ctx.breed ? `${ctx.breed}` : "pet");
};

const baseballStatTemplates: Array<(ctx: FunFactContext) => FunFactStatDefinition> = [
  (ctx) => {
    const digits = randomInt(ctx.random, 820, 999);
    const descriptions = [
      "Snack success average the scouts can’t stop talking about",
      "{name} connects with every toss like a stadium legend",
      "Pitchers fear {name}'s sweet spot more than rain delays",
    ];
    return {
      icon: <Target className="w-5 h-5 text-blue-500" />,
      label: "Batting Average",
      value: `.${digits.toString().padStart(3, "0")}`,
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const homers = randomInt(ctx.random, 48, 168);
    const descriptions = [
      "Fence-clearing fetch wins this season",
      "Crowd-pleasing moonshots sparked by tail wag momentum",
      "{name} sends every chew toy into the cheap seats",
    ];
    return {
      icon: <Award className="w-5 h-5 text-green-500" />,
      label: "Home Run Streak",
      value: homers.toString(),
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const steals = randomInt(ctx.random, 35, 120);
    const descriptions = [
      "Bases swiped with dazzling pawwork",
      "Every treat bowl is home plate to {name}",
      "Catchers say {name} is impossible to throw out",
    ];
    return {
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      label: "Stolen Snacks",
      value: steals.toString(),
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const fans = randomInt(ctx.random, 18, 72);
    const descriptions = [
      "Members in the official paw-sitive fan club",
      "Neighborhood supporters chanting every at-bat",
      "Season ticket holders for {name}'s highlight reel",
    ];
    return {
      icon: <Users className="w-5 h-5 text-purple-500" />,
      label: "Fan Club Size",
      value: `${fans}K`,
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const victories = randomInt(ctx.random, 12, 58);
    const descriptions = [
      "Walk-off fetches sealed with a wag",
      "Legendary comebacks started in the backyard",
      "{name} delivers clutch plays whenever the snacks are on the line",
    ];
    return {
      icon: <Trophy className="w-5 h-5 text-amber-500" />,
      label: "Game-Winning Fetches",
      value: victories.toString(),
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
];

const baseballQuotePools: Record<string, string[]> = {
  Playful: [
    "{name} turns every inning into a sprint to the snack table—and always slides in safe!",
    "Give {name} a tennis ball and the park turns into a sold-out stadium.",
  ],
  Loyal: [
    "{name} is the teammate who never lets a fly ball—or a friend—hit the ground.",
    "Clubhouse rule: follow {name}'s lead and you’ll never lose heart or hustle.",
  ],
  Smart: [
    "{name} reads the defense faster than any catcher I’ve ever coached.",
    "Game film shows {name} predicting plays three treats ahead of everyone else.",
  ],
  Energetic: [
    "Pitchers can’t outpace {name}'s zoomies between bases.",
    "Every dugout chant starts with {name}'s unstoppable tail wind.",
  ],
  default: [
    "I’ve never seen a pet keep the crowd buzzing like {name} does every inning.",
    "{name} shows up ready to put Raleigh on the map every single game.",
    "If heart won championships, {name} would already have a trophy case full.",
  ],
};

const baseballBreedTemplates: BreedTemplate[] = [
  {
    matches: ["golden retriever"],
    templates: [
      "Golden Retrievers like {name} were bred for world-class fetch—no wonder scouts love that glove paw.",
      "{name} channels generations of Golden Retriever hustle into highlight-reel grabs.",
    ],
  },
  {
    matches: ["border collie"],
    templates: [
      "Border Collies like {name} call the plays before they happen—base coaches can’t keep up!",
      "No defensive shift can fool a Border Collie legend like {name}.",
    ],
  },
  {
    matches: ["labrador"],
    templates: [
      "Labradors like {name} have the stamina to play extra innings and still beg for batting practice.",
      "{name}'s Labrador roots make every dive into the outfield grass a guaranteed catch.",
    ],
  },
];

const baseballGeneralFunFacts: Array<(ctx: FunFactContext) => string> = [
  (ctx) => {
    const laps = randomInt(ctx.random, 3, 9);
    return `${ctx.petName} runs ${laps} celebratory laps around home plate after every big win.`;
  },
  (ctx) => {
    const treats = randomInt(ctx.random, 24, 64);
    const label = ctx.breed ? ` the ${ctx.breed}` : "";
    return `${ctx.petName}${label} keeps a locker stocked with ${treats} lucky treats for the team.`;
  },
  (ctx) => {
    const bpm = randomInt(ctx.random, 80, 128);
    return `Scouts report ${ctx.petName}'s tail wags hit ${bpm} bpm when the crowd starts chanting.`;
  },
  (ctx) => {
    const minutes = randomInt(ctx.random, 15, 45);
    return `${ctx.petName} studies highlight reels for ${minutes} minutes before every imaginary doubleheader.`;
  },
];

const superheroStatTemplates: Array<(ctx: FunFactContext) => FunFactStatDefinition> = [
  (ctx) => {
    const power = randomInt(ctx.random, 9000, 22000);
    return {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      label: "Power Level",
      value: power.toLocaleString(),
      description: "Over maximum cuteness containment threshold",
    };
  },
  (ctx) => {
    const rescues = randomInt(ctx.random, 180, 980);
    const descriptions = [
      "Neighborhood hearts saved from villainous boredom",
      "Successful missions logged in the hero playbook",
      "Families rescued from low cuddle levels",
    ];
    return {
      icon: <Award className="w-5 h-5 text-red-500" />,
      label: "Rescue Missions",
      value: rescues.toString(),
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const speed = randomInt(ctx.random, 120, 280);
    const descriptions = [
      "Zoomies measured in heroic miles per hour",
      "Faster than a delivery driver with treats",
      "{name} sprints past villains before they can blink",
    ];
    return {
      icon: <Rocket className="w-5 h-5 text-sky-500" />,
      label: "Flight Speed",
      value: `${speed} mph`,
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const rating = pickOne(ctx.random, ["LEGENDARY", "MYTHIC", "UNSTOPPABLE", "COSMIC"]);
    const descriptions = [
      "Coach-certified hero rating",
      "Citizens agree: {name} is top-tier hero material",
      "Caped community ranks {name} among the greats",
    ];
    return {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      label: "Hero Rating",
      value: rating,
      description: formatTemplate(pickOne(ctx.random, descriptions), ctx),
    };
  },
  (ctx) => {
    const shield = randomInt(ctx.random, 92, 100);
    return {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      label: "Shield Strength",
      value: `${shield}%`,
      description: "Success rate when guarding the household perimeter",
    };
  },
];

const superheroQuotePools: Record<string, string[]> = {
  Brave: [
    "With great paws comes great responsibility—and {name} charges in first every time.",
    "Danger takes one look at {name} and decides to nap instead.",
  ],
  Protective: [
    "{name} keeps the whole block safe, one wag at a time.",
    "No trespassing sign needed—{name}'s watchful eyes handle it.",
  ],
  Energetic: [
    "Faster than a zoomie, more powerful than a vacuum cleaner—that’s {name}.",
    "{name} converts every ounce of energy into pure heroics.",
  ],
  Loyal: [
    "You can’t spell ‘loyal’ without {name}—well, you can, but it’s less inspiring.",
    "{name} guards their people like a pro with a heart-shaped badge.",
  ],
  default: [
    "Every neighborhood deserves a defender like {name}—cape or no cape.",
    "{name}'s hero training never stops, even during nap time.",
    "Cape optional, courage guaranteed whenever {name} shows up.",
  ],
};

const superheroBreedTemplates: BreedTemplate[] = [
  {
    matches: ["german shepherd"],
    templates: [
      "German Shepherds like {name} have been real-life heroes for over a century—this cape is well earned.",
      "{name}'s German Shepherd instincts make every mission a success story.",
    ],
  },
  {
    matches: ["husky"],
    templates: [
      "Huskies like {name} have the stamina to run patrol routes for miles without breaking a sweat.",
      "{name}'s Husky heritage powers blizzards of heroic zoomies.",
    ],
  },
  {
    matches: ["rottweiler"],
    templates: [
      "Rottweilers like {name} were bred to protect—no wonder this hero takes guard duty seriously.",
      "{name}'s Rottweiler roots fuel a heart as strong as their super bark.",
    ],
  },
];

const superheroGeneralFunFacts: Array<(ctx: FunFactContext) => string> = [
  (ctx) => {
    const patrols = randomInt(ctx.random, 4, 11);
    return `${ctx.petName} can finish ${patrols} rooftop patrols before breakfast.`;
  },
  (ctx) => {
    const kids = randomInt(ctx.random, 5, 14);
    return `Neighborhood kids awarded ${ctx.petName} ${kids} honorary cape pins.`;
  },
  (ctx) => {
    const response = randomInt(ctx.random, 2, 7);
    return `When duty calls, ${ctx.petName} suits up in ${response} tail wags flat.`;
  },
  (ctx) => {
    const naps = randomInt(ctx.random, 6, 18);
    return `Legend says ${ctx.petName} recharges with ${naps}-minute power naps between missions.`;
  },
];

const selectQuote = (pools: Record<string, string[]>, ctx: FunFactContext): string => {
  const entries = Object.entries(pools);
  const traitMatch = ctx.traits.find((trait) =>
    entries.some(([key]) => key.toLowerCase() === trait.toLowerCase())
  );
  const resolvedKey = traitMatch
    ? entries.find(([key]) => key.toLowerCase() === traitMatch.toLowerCase())?.[0]
    : undefined;
  const pool = (resolvedKey && pools[resolvedKey]) || pools.default;
  return formatTemplate(pickOne(ctx.random, pool), ctx);
};

const buildFunFactFromTemplates = (
  ctx: FunFactContext,
  breedTemplates: BreedTemplate[],
  generalBuilders: Array<(ctx: FunFactContext) => string>,
): string => {
  if (ctx.breed) {
    const breedLower = ctx.breed.toLowerCase();
    const match = breedTemplates.find((template) =>
      template.matches.some((candidate) => breedLower.includes(candidate))
    );
    if (match) {
      const template = pickOne(ctx.random, match.templates);
      return formatTemplate(template, ctx);
    }
  }

  const builder = pickOne(ctx.random, generalBuilders);
  return builder(ctx);
};

const buildBaseballFallback = (ctx: FunFactContext): FunFactFallback => ({
  stats: pickMany(ctx.random, baseballStatTemplates, 3).map((builder) => builder(ctx)),
  quote: selectQuote(baseballQuotePools, ctx),
  funFact: buildFunFactFromTemplates(ctx, baseballBreedTemplates, baseballGeneralFunFacts),
});

const buildSuperheroFallback = (ctx: FunFactContext): FunFactFallback => ({
  stats: pickMany(ctx.random, superheroStatTemplates, 3).map((builder) => builder(ctx)),
  quote: selectQuote(superheroQuotePools, ctx),
  funFact: buildFunFactFromTemplates(ctx, superheroBreedTemplates, superheroGeneralFunFacts),
});

interface ResultSectionProps {
  transformationResult: TransformationResult;
  petData: PetData;
  selectedTheme: Theme;
  userEmail: string;
  userName?: string | null;
  onCreateAnother: () => void;
}

export default function ResultSection({ transformationResult, petData, selectedTheme, userEmail, userName, onCreateAnother }: ResultSectionProps) {
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
  const [directDownloadUrl, setDirectDownloadUrl] = useState<string | null>(() => transformationResult.transformedImageUrl ?? null);
  const [directDownloadError, setDirectDownloadError] = useState<string | null>(null);
  const [hasAutoTriggeredEmail, setHasAutoTriggeredEmail] = useState(false);

  const SHARE_SITE_URL = 'https://transform.thepetpantry.com';

  const platformHandles: Record<string, string> = {
    facebook: '@FeedYourPetscom',
    twitter: '@FeedYourPetsCom',
    instagram: '@thepetpantrync',
    default: '@thepetpantrync',
  };

  const buildShareCaption = (
    platform?: string,
    options?: {
      includeLink?: boolean;
    },
  ) => {
    const includeLink = options?.includeLink ?? true;
    const platformHandle = platformHandles[platform ?? 'default'] || platformHandles.default;
    const themeHighlight = selectedTheme === 'baseball' ? 'a legendary baseball all-star ⚾' : 'an epic superhero 🦸‍♂️';
    const baseText = `🎉 Meet ${petData.name}! Now ${themeHighlight}!`;
    const challengeLine = 'I dare you to make your pet a legend!';
    const calloutParts = [platformHandle];
    if (includeLink) {
      calloutParts.push(SHARE_SITE_URL);
    }
    const callout = calloutParts.filter(Boolean).join(' ');
    const caption = [baseText, challengeLine, callout].filter(Boolean).join('\n');

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

  const resolveShareImage = useCallback(async () => {
    const imageUrl = transformationResult.transformedImageUrl;
    if (!imageUrl) {
      return null;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image for sharing');
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return null;
    }

    const fileType = blob.type || 'image/jpeg';
    const extension = fileType.includes('/') ? fileType.split('/')[1] : 'jpg';
    const fileName = `${petData.name}-${selectedTheme}-legend.${extension}`;
    return new File([blob], fileName, { type: fileType });
  }, [petData.name, selectedTheme, transformationResult.transformedImageUrl]);

  useEffect(() => {
    if (typeof window !== 'object') {
      return;
    }

    const nav = window.navigator as ShareCapableNavigator;
    if (typeof nav.share === 'function') {
      setNativeShareAvailable(true);
    }
  }, []);

  const handleSocialShare = async (platform: string) => {
    const shareUrl = window.location.href;
    const { caption: enhancedShareText } = buildShareCaption(platform);
    const imageUrl = transformationResult.transformedImageUrl;

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(enhancedShareText)}`;
        break;
      case 'twitter':
        // Twitter/X will show image preview from URL
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(enhancedShareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram': {
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
      }
      case 'download-share': {
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

    let files: File[] | undefined;

    try {
      const file = await resolveShareImage();
      if (file) {
        const candidateFiles = [file];
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

  const sendEmailCapture = useCallback(async (mode: "auto" | "download") => {
    if (!transformationResult?.id || !userEmail) {
      return;
    }

    if (mode === "download") {
      setIsDownloadPending(true);
      setDirectDownloadError(null);
    }

    try {
      const payload: Record<string, unknown> = {
        email: userEmail,
        transformationId: transformationResult.id,
      };

      if (userName) {
        payload.name = userName;
      }

      if (transformationResult.transformedImageUrl) {
        payload.imageUrl = transformationResult.transformedImageUrl;
      }

      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Email capture failed: ${response.status}`);
      }

      const data = await response.json();
      const finalUrl = data?.imageUrl || transformationResult.transformedImageUrl || directDownloadUrl;

      if (data?.imageUrl) {
        setDirectDownloadUrl(data.imageUrl);
      } else if (transformationResult.transformedImageUrl) {
        setDirectDownloadUrl(transformationResult.transformedImageUrl);
      }

      if (mode === "download") {
        if (finalUrl) {
          triggerDirectDownload(finalUrl);
        }
        setIsDownloadRecorded(true);
        setIsSuccessModalOpen(true);
        toast({
          title: "Download started",
          description: "Check your inbox for the high-res image!",
        });
      } else {
        setHasAutoTriggeredEmail(true);
        setIsDownloadRecorded(true);
      }

      return data;
    } catch (error) {
      if (mode === "download") {
        console.error('Failed to trigger email capture', error);
        setDirectDownloadError('We could not start the download automatically. Please try again later.');
        toast({
          title: "Download failed",
          description: "We couldn't send the high-res image. Please try again.",
          variant: "destructive",
        });
      } else {
        console.error('Failed to auto-trigger email capture', error);
      }
    } finally {
      if (mode === "download") {
        setIsDownloadPending(false);
      }
    }
  }, [directDownloadUrl, toast, transformationResult, triggerDirectDownload, userEmail, userName]);

  useEffect(() => {
    if (!hasAutoTriggeredEmail && userEmail && transformationResult?.id) {
      void sendEmailCapture("auto");
    }
  }, [hasAutoTriggeredEmail, sendEmailCapture, transformationResult?.id, userEmail]);

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

    await sendEmailCapture("download");
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
