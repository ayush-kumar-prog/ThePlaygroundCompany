import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackgroundTweets } from "@/components/BackgroundTweets";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");

  const handleStartSimulation = () => {
    if (!idea.trim()) {
      toast.error("Please enter your idea");
      return;
    }
    if (!audience) {
      toast.error("Please select an audience");
      return;
    }

    navigate("/simulation", { state: { idea, audience } });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundTweets />
      
      {/* Gradient glow effect */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {!showForm ? (
            <div className="text-center animate-fade-in">
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

              <Button
                size="lg"
                onClick={() => setShowForm(true)}
                className="text-lg px-8 py-6 shadow-lg animate-scale-in hover:scale-105 transition-transform"
              >
                <Zap className="w-5 h-5 mr-2" />
                New Simulation
              </Button>
            </div>
          ) : (
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50 animate-scale-in">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Start Your Simulation
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idea">Your Idea</Label>
                  <Textarea
                    id="idea"
                    placeholder="Paste your idea or a link to your project..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="min-h-[150px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what you're building or paste a link to learn more
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger id="audience">
                      <SelectValue placeholder="Select your audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tech Twitter">Tech Twitter</SelectItem>
                      <SelectItem value="Product Hunt Community">Product Hunt Community</SelectItem>
                      <SelectItem value="Early Adopters">Early Adopters</SelectItem>
                      <SelectItem value="Enterprise Decision Makers">Enterprise Decision Makers</SelectItem>
                      <SelectItem value="Indie Hackers">Indie Hackers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleStartSimulation}
                    className="flex-1"
                    size="lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Simulate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
