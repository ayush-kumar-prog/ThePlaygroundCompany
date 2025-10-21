import { MessageCircle, Heart, Repeat2 } from "lucide-react";

interface FloatingTweetProps {
  text: string;
  username: string;
}

export const FloatingTweet = ({ text, username }: FloatingTweetProps) => {
  return (
    <div className="w-full p-4 rounded-xl backdrop-blur-lg bg-gradient-to-br from-primary/20 via-accent/20 to-primary-glow/20 border border-primary/30 mb-4 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-primary/50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-primary-glow flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground/90">@{username}</p>
          <p className="text-xs text-foreground/70 mt-1">{text}</p>
          <div className="flex gap-4 mt-3 text-muted-foreground/60">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{Math.floor(Math.random() * 50)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat2 className="w-3 h-3" />
              <span className="text-xs">{Math.floor(Math.random() * 100)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span className="text-xs">{Math.floor(Math.random() * 200)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
