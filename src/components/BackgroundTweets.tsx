import { FloatingTweet } from "./FloatingTweet";

const mockTweets = [
  { username: "techguru", text: "Just discovered this amazing new framework! Game changer 🚀" },
  { username: "devlife", text: "Working on something exciting. Can't wait to share it with everyone!" },
  { username: "startupfounder", text: "Building in public is the best way to get feedback early" },
  { username: "codemaster", text: "This new AI tool just saved me 3 hours of work. Incredible." },
  { username: "productlead", text: "User feedback is gold. Always listen to your early adopters." },
  { username: "designerdev", text: "Clean UI + smooth animations = happy users ✨" },
];

export const BackgroundTweets = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {mockTweets.map((tweet, i) => (
        <FloatingTweet
          key={i}
          text={tweet.text}
          username={tweet.username}
          delay={i * 1.5}
          position={{
            top: `${10 + (i * 15)}%`,
            left: i % 2 === 0 ? `${5 + (i * 10)}%` : undefined,
            right: i % 2 === 1 ? `${5 + (i * 8)}%` : undefined,
          }}
        />
      ))}
    </div>
  );
};
