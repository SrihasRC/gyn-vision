'use client';

import { useState, useEffect } from 'react';
import { Mode, Model, ImageResult } from '@/lib/types';
import { fetchModels, segmentImage, segmentVideo } from '@/lib/api';
import { ModelSelector } from '@/components/ModelSelector';
import { ModeToggle } from '@/components/ModeToggle';
import { FileUpload } from '@/components/FileUpload';
import { ImageResults } from '@/components/ImageResults';
import { VideoResults } from '@/components/VideoResults';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Upload } from 'lucide-react';

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [mode, setMode] = useState<Mode>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const fetchedModels = await fetchModels();
        setModels(fetchedModels);
        if (fetchedModels.length > 0) {
          setSelectedModelId(fetchedModels[0].id);
        }
      } catch (err) {
        setError('Failed to load models');
        console.error(err);
      }
    };
    loadModels();
  }, []);

  // Handle mode change - clear results
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSelectedFile(null);
    setImageResult(null);
    setVideoUrl(null);
    setError(null);
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  // Handle segmentation
  const handleSegment = async () => {
    if (!selectedFile || !selectedModelId) return;

    setLoading(true);
    setError(null);
    setImageResult(null);
    setVideoUrl(null);

    try {
      if (mode === 'image') {
        const result = await segmentImage(selectedFile, selectedModelId);
        setImageResult(result);
      } else {
        const url = await segmentVideo(selectedFile, selectedModelId);
        setVideoUrl(url);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Segmentation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Laparoscopic Segmentation</h1>
            <p className="text-xs text-muted-foreground">Multi-model AI segmentation</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <Card className="p-4 space-y-4 sticky top-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Settings</h3>
                
              <div className="space-y-4">
                <ModelSelector
                  models={models}
                  selectedId={selectedModelId}
                  onSelect={setSelectedModelId}
                  disabled={loading}
                />

                <ModeToggle
                  mode={mode}
                  onChange={handleModeChange}
                  disabled={loading}
                />

                <FileUpload
                  mode={mode}
                  onFileSelect={handleFileSelect}
                  disabled={loading}
                />

                <Button
                  className="w-full"
                  onClick={handleSegment}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Run Segmentation'
                  )}
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-3">
            {imageResult ? (
              <ImageResults
                result={imageResult}
                modelName={selectedModel?.name}
              />
            ) : videoUrl ? (
              <VideoResults
                videoUrl={videoUrl}
                modelName={selectedModel?.name}
              />
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center min-h-[400px] border-dashed">
                <div className="text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No results yet</p>
                  <p className="text-xs mt-1">
                    Upload {mode === 'image' ? 'an image' : 'a video'} and run segmentation
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
