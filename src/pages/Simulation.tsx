import { useState } from "react";
import { ArrowLeft, Download, Edit, Sparkles, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SimulationCard } from "@/components/SimulationCard";
import { BackgroundTweets } from "@/components/BackgroundTweets";
import { toast } from "sonner";

export default function Simulation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedIdea, setEditedIdea] = useState("");

  // Fetch simulation with polling while status is "generating"
  const { data, isLoading, error } = useQuery({
    queryKey: ['simulation', id],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`/api/simulations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch simulation');
      }

      return response.json();
    },
    enabled: !!id,
    refetchInterval: (data) => {
      // Poll every 2 seconds while generating
      return data?.simulation?.status === 'generating' ? 2000 : false;
    },
    retry: 1,
  });

  const simulation = data?.simulation;
  const tweets = data?.tweets || [];

  // Update editedIdea when simulation loads
  if (simulation && !editedIdea) {
    setEditedIdea(simulation.ideaText);
  }

  const handleRerun = async () => {
    if (!editedIdea.trim()) {
      toast.error("Please enter your idea");
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('/api/simulations/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          simulationId: id,
          newIdeaText: editedIdea
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rerun simulation');
      }

      setIsEditing(false);
      toast.success("Rerunning simulation with updated idea");
      
      // The query will automatically start polling again since status will be "generating"
    } catch (error) {
      toast.error("Failed to rerun simulation");
      console.error('Rerun error:', error);
    }
  };

  const handleDownload = () => {
    if (!simulation || tweets.length === 0) {
      toast.error("No tweets to download yet");
      return;
    }

    try {
      // Simple text-based download for now
      // TODO: Implement proper PDF generation in Phase 4
      const praises = tweets.filter((t: any) => t.sentiment === 'praise').slice(0, 6);
      const worries = tweets.filter((t: any) => t.sentiment === 'worry').slice(0, 6);
      
      let content = `Simulation Results\n\n`;
      content += `Idea: ${simulation.ideaText}\n`;
      content += `Audience: ${simulation.audience}\n`;
      content += `Total Tweets: ${tweets.length}\n\n`;
      content += `--- TOP PRAISES ---\n`;
      praises.forEach((t: any, i: number) => {
        content += `${i + 1}. ${t.author}: ${t.text}\n\n`;
      });
      content += `\n--- TOP CONCERNS ---\n`;
      worries.forEach((t: any, i: number) => {
        content += `${i + 1}. ${t.author}: ${t.text}\n\n`;
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Summary downloaded!");
    } catch (error) {
      toast.error("Failed to download summary");
      console.error('Download error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <BackgroundTweets />
        <div className="relative z-10 text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading simulation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !simulation) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <BackgroundTweets />
        <div className="relative z-10 text-center max-w-md">
          <p className="text-destructive mb-4">Failed to load simulation</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isGenerating = simulation.status === 'generating';
  const hasFailed = simulation.status === 'failed';

  // Fun loading messages
  const loadingMessages = [
    "Waking up the reply guys...",
    "Generating hot takes...",
    "Summoning tech Twitter...",
    "Consulting the hive mind...",
    "Brewing controversial opinions...",
    "Deploying virtual skeptics...",
  ];
  const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundTweets />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                Simulation Results
              </h1>
              <p className="text-muted-foreground">
                Audience: <span className="text-accent font-semibold">{simulation.audience}</span>
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
                {!isEditing && !isGenerating && (
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
                    <Sparkles className="w-4 h-4 mr-2" />
                    Rerun Simulation
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedIdea(simulation.ideaText);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </Card>

            {hasFailed && (
              <Card className="p-8 text-center bg-destructive/10 border-destructive/50 mb-6">
                <p className="text-destructive font-semibold mb-2">Generation Failed</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Something went wrong. Please try editing and rerunning the simulation.
                </p>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit & Retry
                </Button>
              </Card>
            )}

            {isGenerating ? (
              <div className="text-center py-12">
                <div className="inline-block animate-pulse-glow">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                </div>
                <p className="text-lg text-muted-foreground mb-2">{randomMessage}</p>
                <p className="text-sm text-muted-foreground">This usually takes 10-15 seconds</p>
              </div>
            ) : tweets.length > 0 ? (
              <>
                <div className="space-y-4 mb-6">
                  {tweets.map((tweet: any, i: number) => {
                    // Map API sentiment to component sentiment
                    const mappedSentiment = 
                      tweet.sentiment === 'praise' ? 'positive' :
                      tweet.sentiment === 'worry' ? 'negative' :
                      'neutral';
                    
                    return (
                      <SimulationCard
                        key={tweet.id}
                        username={tweet.author}
                        text={tweet.text}
                        sentiment={mappedSentiment as "positive" | "negative" | "neutral"}
                        delay={i * 0.05}
                      />
                    );
                  })}
                </div>

                <div className="text-center animate-fade-in-delay">
                  <Button onClick={handleDownload} size="lg" className="shadow-lg">
                    <Download className="w-4 h-4 mr-2" />
                    Download Summary
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Includes top 6 praises and top 6 concerns
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tweets generated yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
