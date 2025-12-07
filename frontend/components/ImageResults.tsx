/**
 * Image segmentation results display component
 */
'use client';

import { ImageResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Legend } from './Legend';
import { Image as ImageIcon } from 'lucide-react';

interface ImageResultsProps {
  result: ImageResult;
  modelName?: string;
}

export function ImageResults({ result, modelName }: ImageResultsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Results</h2>
          {modelName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {modelName}
            </p>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-3 bg-muted/30">
            <p className="text-xs font-medium mb-2">Original</p>
            <div className="relative aspect-video w-full rounded overflow-hidden bg-background">
              <img
                src={result.original_image}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-3 bg-muted/30">
            <p className="text-xs font-medium mb-2">Mask</p>
            <div className="relative aspect-video w-full rounded overflow-hidden bg-background">
              <img
                src={result.mask_image}
                alt="Mask"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-3 bg-muted/30">
            <p className="text-xs font-medium mb-2">Overlay</p>
            <div className="relative aspect-video w-full rounded overflow-hidden bg-background">
              <img
                src={result.overlay_image}
                alt="Overlay"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Legend classes={result.classes} showStats={true} />
    </div>
  );
}
