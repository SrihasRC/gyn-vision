/**
 * Video segmentation results display component
 */
'use client';

import { Card } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoLegend } from './VideoLegend';

interface VideoResultsProps {
  videoUrl: string;
  modelName?: string;
}

// Static legend for video results (same classes as backend)
const VIDEO_CLASSES = [
  { id: 1, name: 'Uterus', color: '#0000FF' },
  { id: 2, name: 'Fallopian Tube', color: '#00FF00' },
  { id: 3, name: 'Ovary', color: '#A020F0' }
];

export function VideoResults({ videoUrl, modelName }: VideoResultsProps) {
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

      {/* Color Legend */}
      <Card className="overflow-hidden">
        <div className="bg-muted/30 p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Color Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {VIDEO_CLASSES.map((classInfo) => (
              <div
                key={classInfo.id}
                className="flex items-center gap-2 p-2 bg-background rounded border"
              >
                <div
                  className="w-4 h-4 rounded shrink-0 border"
                  style={{ backgroundColor: classInfo.color }}
                />
                <div className="text-xs font-medium capitalize truncate">
                  {classInfo.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <VideoLegend />
    </div>
  );
}
