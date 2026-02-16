import { Country } from "@/data/countries";

interface FlagCardProps {
  country: Country;
  revealed: boolean;
}

const FlagCard = ({ country, revealed }: FlagCardProps) => {
  return (
    <div className="game-card max-w-md w-full mx-auto">
      {/* Flag */}
      <div className="p-5 pb-0">
        <div className="flag-container rounded-xl overflow-hidden border border-border">
          <img
            src={country.flag}
            alt="Guess this country's flag"
            className="w-full h-full object-cover transition-transform duration-500"
            draggable={false}
          />
        </div>
      </div>

      {/* Country Name Area */}
      <div className="p-5 text-center min-h-[5rem] flex items-center justify-center">
        {revealed ? (
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground country-reveal">
            {country.name}
          </h2>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-2xl">🤔</span>
            <p className="font-display text-lg font-medium">
              Which country is this?
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlagCard;
