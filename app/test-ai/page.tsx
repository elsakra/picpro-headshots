"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Download, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function TestAIPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("professional corporate headshot portrait of a confident businessperson, studio lighting, neutral gray background, sharp focus, 8k photography");

  const generateImage = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/test-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.images) {
        setImages(prev => [...data.images, ...prev]);
      }
    } catch (err) {
      setError("Failed to generate. Check console for details.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid bg-radial-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">PicPro AI</span>
            </Link>
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              Live AI Test
            </Badge>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Test Real AI Generation</h1>
            <p className="text-muted-foreground">
              This page calls the Replicate API directly to generate real AI images.
              <br />
              No demo data - these are actual AI-generated images.
            </p>
          </div>

          <Card className="p-6 mb-8">
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-lg bg-muted border border-border text-sm"
              rows={3}
            />
            
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="mt-4 w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating with Replicate AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Real AI Image
                </>
              )}
            </Button>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive">
                {error}
              </div>
            )}
          </Card>

          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {images.map((url, i) => (
                <Card key={i} className="overflow-hidden group relative">
                  <img
                    src={url}
                    alt={`Generated image ${i + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Open Full Size
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {images.length === 0 && !isGenerating && (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Click the button above to generate a real AI image</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

