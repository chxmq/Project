import { cn } from '@/shared/utils/utils';
import { Personality } from '@/shared/constants/personalities';
import { Button } from '@/components/button';
import { Card, CardContent } from '@/components/card';
import { Badge } from '@/components/badge';

interface PersonalitySelectorProps {
  personalities: Personality[];
  selectedPersonality: string;
  onSelect: (personalityId: string) => void;
  disabled?: boolean;
}

const PersonalitySelector = ({
  personalities,
  selectedPersonality,
  onSelect,
  disabled = false
}: PersonalitySelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎭</span>
        <h3 className="text-lg font-semibold">Choose Your AI Personality</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalities.map((personality) => (
          <Card
            key={personality.id}
            className={cn(
              "group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg",
              selectedPersonality === personality.id
                ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                : "hover:border-primary/20",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onSelect(personality.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{personality.emoji}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{personality.name}</h4>
                    {selectedPersonality === personality.id && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {personality.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {personality.traits.map((trait) => (
                      <Badge
                        key={trait}
                        variant="secondary"
                        className="text-xs"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground italic">
                    "{personality.greeting}"
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonalitySelector;
