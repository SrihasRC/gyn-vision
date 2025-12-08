/**
 * Video segmentation results display component
 */
'use client';

import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoLegend } from './VideoLegend';
import { ClassInfo } from '@/lib/types';

interface VideoResultsProps {
  videoUrl: string;
  modelName?: string;
  classes?: ClassInfo[];
}

export function VideoResults({ videoUrl, modelName, classes }: VideoResultsProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `segmented_video.mp4`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Video Results</h2>
          {modelName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {modelName}
            </p>
          )}
        </div>
        <Button 
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>

      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-muted/30">
          <div className="relative w-full rounded overflow-hidden bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full h-auto"
              style={{ maxHeight: '65vh' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <VideoLegend classes={classes} />
    </div>
  );
}
