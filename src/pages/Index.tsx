import { useState, useCallback, useEffect } from "react";
import { countries, Country } from "@/data/countries";
import FlagCard from "@/components/FlagCard";
import Controls from "@/components/Controls";
import ScoreBoard from "@/components/ScoreBoard";

/** Pick a random country, avoiding the previous one */
function getRandomCountry(previous?: Country): Country {
  const pool = previous
    ? countries.filter((c) => c.code !== previous.code)
    : countries;
  return pool[Math.floor(Math.random() * pool.length)];
}

const Index = () => {
  const [current, setCurrent] = useState<Country>(() => getRandomCountry());
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    setScore((s) => s + 1);
    setTotal((t) => t + 1);
  }, []);

  const handleNext = useCallback(() => {
    setCurrent((prev) => getRandomCountry(prev));
    setRevealed(false);
  }, []);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !revealed) {
        e.preventDefault();
        handleReveal();
      }
      if (e.code === "Enter" && revealed) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [revealed, handleReveal, handleNext]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">
          🌍 Flag Guesser
        </h1>
        <p className="text-muted-foreground font-body text-sm sm:text-base">
          Can you name the country from its flag?
        </p>
      </div>

      {/* Score */}
      <div className="mb-6 animate-fade-in">
        <ScoreBoard score={score} total={total} />
      </div>

      {/* Flag Card */}
      <div key={current.code} className="animate-scale-in w-full max-w-md">
        <FlagCard country={current} revealed={revealed} />
      </div>

      {/* Controls */}
      <Controls revealed={revealed} onReveal={handleReveal} onNext={handleNext} />

      {/* Keyboard hint */}
      <p className="mt-6 text-xs text-muted-foreground font-body hidden sm:block">
        Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Space</kbd> to reveal · <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Enter</kbd> for next
      </p>
    </div>
  );
};

export default Index;
