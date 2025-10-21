import { MessageCircle, Heart, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingTweetProps {
  text: string;
  username: string;
  delay?: number;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
}

export const FloatingTweet = ({ text, username, delay = 0, position }: FloatingTweetProps) => {
  return (
    <div
      className={cn(
        "absolute w-64 p-4 rounded-xl backdrop-blur-md bg-card/10 border border-border/20",
        "animate-float-slow opacity-20 hover:opacity-40 transition-opacity duration-300"
      )}
      style={{
        ...position,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">@{username}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{text}</p>
          <div className="flex gap-4 mt-3 text-muted-foreground">
            <MessageCircle className="w-3 h-3" />
            <Repeat2 className="w-3 h-3" />
            <Heart className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
