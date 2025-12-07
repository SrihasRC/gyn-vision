/**
 * Video segmentation results display component
 */
'use client';

import { VideoResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Legend } from './Legend';

interface VideoResultsProps {
  result: VideoResult;
  modelName?: string;
}

export function VideoResults({ result, modelName }: VideoResultsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Video Segmentation Results</h2>
        {modelName && (
          <p className="text-sm text-muted-foreground">Model: {modelName}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Total frames: {result.num_frames}
        </p>
      </div>

      {/* Frames Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.frames.map((frame) => (
          <Card key={frame.index} className="p-4">
            <h3 className="text-sm font-semibold mb-2">
              Frame {frame.index} ({frame.time_seconds.toFixed(2)}s)
            </h3>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
              <img
                src={frame.overlay_image}
                alt={`Frame ${frame.index}`}
                className="w-full h-full object-contain"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Legend classes={result.classes} showStats={true} />
    </div>
  );
}
