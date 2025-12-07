'use client';

import { useState, useEffect } from 'react';
import { Mode, Model, ImageResult } from '@/lib/types';
import { fetchModels, segmentImage, segmentVideo } from '@/lib/api';
import { ModelSelector } from '@/components/ModelSelector';
import { ModeToggle } from '@/components/ModeToggle';
import { FileUpload } from '@/components/FileUpload';
import { ImageResults } from '@/components/ImageResults';
import { VideoResults } from '@/components/VideoResults';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Upload } from 'lucide-react';

export default function SegmentationPage() {
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
      }
    };
    loadModels();
  }, []);

  // Handle mode change
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
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Segmentation Tool</h1>
          <p className="text-sm text-muted-foreground">Upload and analyze laparoscopic images or videos</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <Card className="p-5 space-y-5 sticky top-24 shadow-lg">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-1">Configuration</h2>
                <p className="text-xs text-muted-foreground">Select model and upload file</p>
              </div>
                
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
                  size="lg"
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
              <Card className="p-16 flex flex-col items-center justify-center text-center min-h-[500px] border-dashed">
                <div className="text-muted-foreground">
                  <Upload className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No results yet</p>
                  <p className="text-sm">
                    Upload {mode === 'image' ? 'an image' : 'a video'} and run segmentation to see results
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
