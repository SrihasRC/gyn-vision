/**
 * Real-time video segmentation streaming component
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { VideoLegend } from './VideoLegend';
import { ClassInfo } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface StreamingVideoResultsProps {
  modelName?: string;
  classes?: ClassInfo[];
  isStreaming: boolean;
  progress: number;
  currentFrame: number;
  totalFrames: number;
}

export function StreamingVideoResults({
  modelName,
  classes,
  isStreaming,
  progress,
  currentFrame,
  totalFrames
}: StreamingVideoResultsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState<number>(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  // Expose method to update canvas with new frame
  useEffect(() => {
    if (canvasRef.current) {
      (window as any).updateStreamCanvas = (imageData: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new window.Image();
        img.onload = () => {
          // Set canvas size on first frame
          if (canvas.width === 0) {
            canvas.width = img.width;
            canvas.height = img.height;
            setDimensions({ width: img.width, height: img.height });
          }
          ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
      };

      (window as any).setStreamMetadata = (metadata: any) => {
        if (metadata.fps) setFps(metadata.fps);
        if (metadata.width && metadata.height) {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = metadata.width;
            canvas.height = metadata.height;
            setDimensions({ width: metadata.width, height: metadata.height });
          }
        }
      };
    }

    return () => {
      delete (window as any).updateStreamCanvas;
      delete (window as any).setStreamMetadata;
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Real-Time Video Segmentation</h2>
          {modelName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {modelName}
            </p>
          )}
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isStreaming && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Frame {currentFrame} of {totalFrames}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Video Canvas */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-muted/30">
          <div className="relative w-full rounded overflow-hidden bg-black flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto"
              style={{ maxHeight: '65vh' }}
            />
            {!dimensions && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin opacity-50" />
                  <p className="text-sm">Waiting for video stream...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stream Info */}
      {dimensions && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{dimensions.width}x{dimensions.height}</span>
          {fps > 0 && <span>{fps.toFixed(1)} FPS</span>}
        </div>
      )}

      {/* Legend */}
      <VideoLegend classes={classes} />
    </div>
  );
}
