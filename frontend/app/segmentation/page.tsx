'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mode, Model, ImageResult, ClassInfo } from '@/lib/types';
import { fetchModels, segmentImage, segmentVideo, fetchModelClasses } from '@/lib/api';
import { ModelSelector } from '@/components/ModelSelector';
import { ModeToggle } from '@/components/ModeToggle';
import { FileUpload } from '@/components/FileUpload';
import { ImageResults } from '@/components/ImageResults';
import { VideoResults } from '@/components/VideoResults';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Upload, ArrowLeft } from 'lucide-react';

export default function SegmentationPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [mode, setMode] = useState<Mode>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoClasses, setVideoClasses] = useState<ClassInfo[] | undefined>(undefined);
  const [sampleRate, setSampleRate] = useState<number>(15); // Default: ~2fps (every 15th frame)
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
        const url = await segmentVideo(selectedFile, selectedModelId, sampleRate);
        setVideoUrl(url);
        // Fetch class metadata for the model
        try {
          const classes = await fetchModelClasses(selectedModelId);
          setVideoClasses(classes);
        } catch (e) {
          console.error('Failed to fetch model classes:', e);
          // Continue even if classes fetch fails - will use defaults
        }
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
      {/* Header with Back Button */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="border-l h-8 mx-2" />
          <div>
            <h1 className="text-lg font-bold">Segmentation Tool</h1>
            <p className="text-xs text-muted-foreground">Upload and analyze laparoscopic images or videos</p>
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

                {/* Video Sample Rate Slider - Only show for video mode */}
                {mode === 'video' && (
                  <div className="space-y-3">
                    <label className="text-xs font-medium">Processing Speed</label>
                    
                    {/* Preset Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={sampleRate === 30 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSampleRate(30)}
                        disabled={loading}
                        className="text-xs h-8"
                      >
                        Fast
                        <span className="text-[10px] ml-1 opacity-70">(1fps)</span>
                      </Button>
                      <Button
                        type="button"
                        variant={sampleRate === 15 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSampleRate(15)}
                        disabled={loading}
                        className="text-xs h-8"
                      >
                        Balanced
                        <span className="text-[10px] ml-1 opacity-70">(2fps)</span>
                      </Button>
                      <Button
                        type="button"
                        variant={sampleRate === 5 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSampleRate(5)}
                        disabled={loading}
                        className="text-xs h-8"
                      >
                        Quality
                        <span className="text-[10px] ml-1 opacity-70">(6fps)</span>
                      </Button>
                    </div>

                    {/* Custom Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Custom:</span>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={sampleRate}
                          onChange={(e) => setSampleRate(Number(e.target.value))}
                          disabled={loading}
                          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="text-xs font-medium min-w-[60px]">
                          ~{sampleRate}x faster
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Processing every {sampleRate === 1 ? '' : `${sampleRate}${sampleRate === 2 ? 'nd' : sampleRate === 3 ? 'rd' : 'th'} `}frame{sampleRate === 1 ? '' : 's'} 
                        {' '}({Math.round(30 / sampleRate)} frames/sec at 30fps input)
                      </p>
                    </div>
                  </div>
                )}

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
                classes={videoClasses}
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
