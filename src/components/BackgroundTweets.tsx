import { FloatingTweet } from "./FloatingTweet";

const generateMockTweets = () => [
  { username: "techguru", text: "Just discovered this amazing new framework! Game changer 🚀" },
  { username: "devlife", text: "Working on something exciting. Can't wait to share it with everyone!" },
  { username: "startupfounder", text: "Building in public is the best way to get feedback early" },
  { username: "codemaster", text: "This new AI tool just saved me 3 hours of work. Incredible." },
  { username: "productlead", text: "User feedback is gold. Always listen to your early adopters." },
  { username: "designerdev", text: "Clean UI + smooth animations = happy users ✨" },
  { username: "innovator", text: "Shipped three features today. Momentum is everything 💪" },
  { username: "founder_life", text: "The best products come from solving your own problems first" },
  { username: "growth_hacker", text: "Just hit 1K users! This community is incredible 🎉" },
  { username: "tech_writer", text: "Writing about the future of AI and it's mind-blowing" },
  { username: "entrepreneur", text: "Failed fast, learned faster. On to the next iteration!" },
  { username: "ux_designer", text: "Good design is invisible. Great design is unforgettable." },
  { username: "indie_maker", text: "Built and launched in 48 hours. Speed is a feature." },
  { username: "product_geek", text: "Every feature should solve a real problem. No exceptions." },
  { username: "code_wizard", text: "Refactored the entire codebase. Feels so clean now ✨" },
  { username: "startup_advisor", text: "Focus on one thing and do it incredibly well" },
];

export const BackgroundTweets = () => {
  const tweets = generateMockTweets();
  const columns = 6;
  
  // Duplicate tweets to create seamless loop
  const duplicatedTweets = [...tweets, ...tweets];
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      <div className="flex gap-4 h-full">
        {Array.from({ length: columns }).map((_, colIndex) => {
          const isEven = colIndex % 2 === 0;
          const animationClass = isEven ? "animate-scroll-up" : "animate-scroll-down";
          const startOffset = isEven ? 0 : -50;
          
          return (
            <div
              key={colIndex}
              className="flex-1 flex flex-col"
              style={{
                minWidth: "200px",
                maxWidth: "280px",
              }}
            >
              <div
                className={animationClass}
                style={{
                  transform: `translateY(${startOffset}%)`,
                }}
              >
                {duplicatedTweets.map((tweet, tweetIndex) => (
                  <FloatingTweet
                    key={`${colIndex}-${tweetIndex}`}
                    text={tweet.text}
                    username={tweet.username}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
