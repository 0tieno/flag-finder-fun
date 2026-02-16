import { Button } from "@/components/ui/button";
import { Eye, ArrowRight } from "lucide-react";

interface ControlsProps {
  revealed: boolean;
  onReveal: () => void;
  onNext: () => void;
}

const Controls = ({ revealed, onReveal, onNext }: ControlsProps) => {
  return (
    <div className="flex justify-center mt-6">
      {!revealed ? (
        <Button
          onClick={onReveal}
          size="lg"
          className="font-display text-base font-semibold px-8 py-6 rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200 animate-fade-in"
          style={{ boxShadow: "var(--shadow-button)" }}
        >
          <Eye className="w-5 h-5 mr-2" />
          Reveal Answer
        </Button>
      ) : (
        <Button
          onClick={onNext}
          size="lg"
          className="font-display text-base font-semibold px-8 py-6 rounded-xl bg-success text-success-foreground hover:brightness-110 transition-all duration-200 animate-bounce-in"
        >
          Next Flag
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      )}
    </div>
  );
};

export default Controls;
