import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundTweets } from "@/components/BackgroundTweets";

const Index = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  const handleNewSimulation = () => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
    // If not signed in, SignInButton will handle it
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundTweets />
      
      {/* Gradient glow effect */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="mb-8 inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent animate-fade-in">
            Sandbox Playground
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 animate-fade-in-delay">
            Simulate how your audience will react to your idea before you launch.
            <br />
            Get instant feedback from artificial potential customers.
          </p>

          {isLoaded && (
            <div className="flex gap-4 justify-center items-center">
              {!isSignedIn ? (
                <>
                  <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg px-8 py-6 shadow-lg animate-scale-in hover:scale-105 transition-transform"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <Button
                      size="lg"
                      className="text-lg px-8 py-6 shadow-lg animate-scale-in hover:scale-105 transition-transform"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      New Simulation
                    </Button>
                  </SignUpButton>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={handleNewSimulation}
                  className="text-lg px-8 py-6 shadow-lg animate-scale-in hover:scale-105 transition-transform"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
