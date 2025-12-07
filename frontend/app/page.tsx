'use client';

import { useState, useEffect } from 'react';
import { Mode, Model, ImageResult, VideoResult } from '@/lib/types';
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
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
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
    setVideoResult(null);

    try {
      if (mode === 'image') {
        const result = await segmentImage(selectedFile, selectedModelId);
        setImageResult(result);
      } else {
        const result = await segmentVideo(selectedFile, selectedModelId);
        setVideoResult(result);
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
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Gynecology Laparoscopic Segmentation</h1>
          <p className="text-muted-foreground mt-1">
            Multi-model segmentation for laparoscopic images
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 sticky top-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                
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
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            {imageResult ? (
              <ImageResults
                result={imageResult}
                modelName={selectedModel?.name}
              />
            ) : videoResult ? (
              <VideoResults
                result={videoResult}
                modelName={selectedModel?.name}
              />
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="text-muted-foreground">
                  <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No results yet</p>
                  <p className="text-sm mt-2">
                    Upload an {mode} and run segmentation to see results
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
