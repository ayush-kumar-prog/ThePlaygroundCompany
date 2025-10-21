import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, UserButton, useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Plus, Clock, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { BackgroundTweets } from "@/components/BackgroundTweets";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("Tech Twitter");
  const [tweetCount, setTweetCount] = useState([30]);

  // Fetch previous simulations with React Query
  const { data: simulationsData, isLoading: isLoadingSimulations } = useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('/api/simulations/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch simulations');
      }
      
      const data = await response.json();
      return data.simulations || [];
    },
    retry: 1,
  });

  // Create simulation mutation
  const createSimulationMutation = useMutation({
    mutationFn: async (input: { ideaText: string; audience: string; tweetCount: number }) => {
      const token = await getToken();
      const response = await fetch('/api/simulations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create simulation');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Simulation created! Generating tweets...');
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      setShowCreateDialog(false);
      navigate(`/simulation/${data.simulationId}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create simulation');
    }
  });

  const handleCreateSimulation = () => {
    if (!idea.trim()) {
      toast.error("Please enter your idea");
      return;
    }

    createSimulationMutation.mutate({
      ideaText: idea,
      audience: audience,
      tweetCount: tweetCount[0]
    });
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const previousSimulations = simulationsData || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundTweets />
      
      {/* Gradient glow effect */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.firstName || 'there'}!
            </p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Create New Simulation Button */}
        <div className="max-w-4xl mx-auto mb-12">
          <Button
            size="lg"
            onClick={() => setShowCreateDialog(true)}
            className="w-full text-lg py-8 shadow-lg hover:scale-[1.02] transition-transform"
            disabled={createSimulationMutation.isPending}
          >
            {createSimulationMutation.isPending ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Creating Simulation...
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-2" />
                Create New Simulation
              </>
            )}
          </Button>
        </div>

        {/* Previous Simulations */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Previous Simulations
          </h2>

          {isLoadingSimulations ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-border/50">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading your simulations...</p>
            </Card>
          ) : previousSimulations.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-border/50">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No simulations yet. Create your first one to get started!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {previousSimulations.map((sim: any) => (
                <Card
                  key={sim.id}
                  className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all cursor-pointer"
                  onClick={() => navigate(`/simulation/${sim.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-lg font-medium mb-2">{sim.ideaText}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {sim.tweetCount} tweets
                        </span>
                        <span>• {sim.audience}</span>
                        <span>• {formatDate(sim.createdAt)}</span>
                        {sim.status === 'generating' && (
                          <span className="flex items-center gap-1 text-primary">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating...
                          </span>
                        )}
                        {sim.status === 'failed' && (
                          <span className="text-destructive">• Failed</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Simulation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Start Your Simulation</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
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
                  <SelectItem value="Crypto Twitter">Crypto Twitter</SelectItem>
                  <SelectItem value="VC Twitter">VC Twitter</SelectItem>
                  <SelectItem value="Designer Twitter">Designer Twitter</SelectItem>
                  <SelectItem value="Indie Hackers">Indie Hackers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tweet-count">
                Number of Tweets: <span className="text-primary font-semibold">{tweetCount[0]}</span>
              </Label>
              <Slider
                id="tweet-count"
                min={10}
                max={100}
                step={10}
                value={tweetCount}
                onValueChange={setTweetCount}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10</span>
                <span>100</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCreateSimulation}
                className="flex-1"
                size="lg"
                disabled={createSimulationMutation.isPending}
              >
                {createSimulationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Simulate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                size="lg"
                disabled={createSimulationMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
