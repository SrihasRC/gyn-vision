/**
 * Video segmentation results display component
 */
'use client';

import { Card } from '@/components/ui/card';

interface VideoResultsProps {
  videoUrl: string;
  modelName?: string;
}

export function VideoResults({ videoUrl, modelName }: VideoResultsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Video Segmentation Results</h2>
        {modelName && (
          <p className="text-sm text-muted-foreground">Model: {modelName}</p>
        )}
      </div>

      {/* Video Player */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Segmented Video</h3>
        <div className="relative w-full rounded-lg overflow-hidden bg-muted">
          <video
            src={videoUrl}
            controls
            className="w-full h-auto"
            style={{ maxHeight: '70vh' }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Right-click on the video to download
        </p>
      </Card>
    </div>
  );
}
