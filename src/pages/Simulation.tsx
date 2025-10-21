import { useState } from "react";
import { ArrowLeft, Download, Edit, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SimulationCard } from "@/components/SimulationCard";
import { BackgroundTweets } from "@/components/BackgroundTweets";
import { toast } from "sonner";

export default function Simulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { idea, audience } = location.state || {};
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState(idea || "");
  const [simulatedTweets, setSimulatedTweets] = useState<any[]>([]);

  const generateSimulation = (ideaText: string) => {
    setIsSimulating(true);
    setSimulatedTweets([]);
    
    // Simulate API delay
    setTimeout(() => {
      const mockResponses = [
        { username: "tech_enthusiast", text: `This is exactly what ${audience} needs! The potential here is huge 🚀`, sentiment: "positive" as const },
        { username: "skeptic_dev", text: "Interesting concept, but how would this scale? Need more details on the implementation.", sentiment: "neutral" as const },
        { username: "early_adopter", text: "Already love this idea! When can we start testing? Would be happy to provide feedback.", sentiment: "positive" as const },
        { username: "industry_expert", text: "I've seen similar attempts before. What makes this different from existing solutions?", sentiment: "neutral" as const },
        { username: "innovation_fan", text: "This could disrupt the entire space! The timing couldn't be better for something like this 🔥", sentiment: "positive" as const },
        { username: "concerned_user", text: "Not sure about this approach. Have you considered the privacy implications?", sentiment: "negative" as const },
        { username: "product_hunter", text: "Love the simplicity! This solves a real pain point I've been dealing with.", sentiment: "positive" as const },
        { username: "casual_observer", text: "Can someone explain what problem this actually solves? Genuinely curious.", sentiment: "neutral" as const },
      ];
      
      setSimulatedTweets(mockResponses);
      setIsSimulating(false);
      toast.success("Simulation complete!");
    }, 2000);
  };

  const handleRerun = () => {
    if (editedIdea.trim()) {
      generateSimulation(editedIdea);
      setIsEditing(false);
      toast.success("Rerunning simulation with updated idea");
    }
  };

  const handleDownload = () => {
    // Mock PDF download
    toast.success("Summary downloaded! Check your downloads folder.");
  };

  if (!idea) {
    navigate("/");
    return null;
  }

  if (simulatedTweets.length === 0 && !isSimulating) {
    generateSimulation(idea);
  }

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundTweets />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                Simulation Results
              </h1>
              <p className="text-muted-foreground">
                Audience: <span className="text-accent font-semibold">{audience}</span>
              </p>
            </div>

            <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm border-border/50 animate-scale-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Your Idea
                  </h3>
                  {isEditing ? (
                    <Textarea
                      value={editedIdea}
                      onChange={(e) => setEditedIdea(e.target.value)}
                      className="min-h-[100px] mb-4"
                      placeholder="Edit your idea..."
                    />
                  ) : (
                    <p className="text-foreground">{editedIdea}</p>
                  )}
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleRerun} className="flex-1">
                    Rerun Simulation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedIdea(idea);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </Card>

            {isSimulating ? (
              <div className="text-center py-12">
                <div className="inline-block animate-pulse-glow">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                </div>
                <p className="text-lg text-muted-foreground">Simulating reactions...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {simulatedTweets.map((tweet, i) => (
                    <SimulationCard
                      key={i}
                      username={tweet.username}
                      text={tweet.text}
                      sentiment={tweet.sentiment}
                      delay={i * 0.1}
                    />
                  ))}
                </div>

                <div className="text-center animate-fade-in-delay">
                  <Button onClick={handleDownload} size="lg" className="shadow-lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Summary
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Includes top 3 praises and concerns
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
