import { MessageCircle, Heart, Repeat2, User } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SimulationCardProps {
  username: string;
  text: string;
  sentiment?: "positive" | "negative" | "neutral";
  delay?: number;
}

export const SimulationCard = ({ username, text, sentiment = "neutral", delay = 0 }: SimulationCardProps) => {
  const sentimentColors = {
    positive: "from-green-500/10 to-emerald-500/10 border-green-500/30",
    negative: "from-red-500/10 to-rose-500/10 border-red-500/30",
    neutral: "from-primary/10 to-accent/10 border-primary/30",
  };

  return (
    <Card 
      className={`p-4 bg-gradient-to-br ${sentimentColors[sentiment]} backdrop-blur-sm animate-slide-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">@{username}</p>
          <p className="text-sm text-foreground mt-2">{text}</p>
          <div className="flex gap-6 mt-3 text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-accent transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{Math.floor(Math.random() * 50)}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
              <Repeat2 className="w-4 h-4" />
              <span className="text-xs">{Math.floor(Math.random() * 100)}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-xs">{Math.floor(Math.random() * 200)}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};
