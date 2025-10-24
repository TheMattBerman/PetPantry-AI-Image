import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Wand2, Users, Share2 } from "lucide-react";

import type { SiteMetrics } from "@/lib/types";

const INITIAL_METRICS: SiteMetrics = {
  id: "global",
  transforms: 128,
  shares: 340,
  updatedAt: new Date().toISOString(),
};

const HERO_METRICS_SESSION_KEY = "petPantryHeroMetricsSession";

interface HeroSectionProps {
  onStart: () => void;
}

export default function HeroSection({ onStart }: HeroSectionProps) {
  const [metrics, setMetrics] = useState<SiteMetrics>(INITIAL_METRICS);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let sessionAlreadyCounted = false;
    try {
      sessionAlreadyCounted =
        window.sessionStorage.getItem(HERO_METRICS_SESSION_KEY) === "1";
    } catch (error) {
      sessionAlreadyCounted = false;
    }

    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/stats", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Failed to load metrics: ${res.status}`);
        }
        const data = await res.json();
        const fetchedMetrics: SiteMetrics | undefined = data?.metrics;
        if (fetchedMetrics) {
          setMetrics(fetchedMetrics);
        }
      } catch (error) {
        // swallow error, keep default metrics
      }
    };

    const incrementMetrics = async () => {
      try {
        const transformsDelta = Math.floor(Math.random() * 5) + 3; // 3-7
        const sharesDelta = transformsDelta * (Math.floor(Math.random() * 3) + 2); // 2-4x
        const res = await fetch("/api/stats/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ transformsDelta, sharesDelta }),
        });
        if (res.ok) {
          const data = await res.json();
          const updatedMetrics: SiteMetrics | undefined = data?.metrics;
          if (updatedMetrics) {
            setMetrics(updatedMetrics);
          }
        }
      } catch (error) {
        // ignore increment errors
      }
    };

    fetchMetrics().finally(() => {
      if (!sessionAlreadyCounted) {
        incrementMetrics().finally(() => {
          try {
            window.sessionStorage.setItem(HERO_METRICS_SESSION_KEY, "1");
          } catch (error) {
            // ignore session storage errors
          }
        });
      }
    });
  }, []);

  return (
    <section className="text-center mb-12 fade-in" id="hero-section">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          Transform Your Pet Into A{" "}
          <br></br><span className="text-brand-primary">North Carolina Legend!</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Turn your furry friend into a sports legend or superhero with our AI-powered transformation tool.
          Create shareable content that will make your pet the star they deserve to be!
        </p>

        {/* Social Proof */}
        <div className="flex items-center justify-center space-x-8 mb-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Users className="text-blue-500" />
            <span className="font-semibold">
              {metrics.transforms.toLocaleString()}
            </span>
            <span>pets transformed</span>
          </div>
          <div className="flex items-center space-x-2">
            <Share2 className="text-green-500" />
            <span className="font-semibold">
              {metrics.shares.toLocaleString()}
            </span>
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
                src="/images/superkane.jpg"
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
