/**
 * Image segmentation results display component
 */
'use client';

import { ImageResult } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Legend } from './Legend';
import Image from 'next/image';

interface ImageResultsProps {
  result: ImageResult;
  modelName?: string;
}

export function ImageResults({ result, modelName }: ImageResultsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Segmentation Results</h2>
        {modelName && (
          <p className="text-sm text-muted-foreground">Model: {modelName}</p>
        )}
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Original Image</h3>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={result.original_image}
              alt="Original"
              className="w-full h-full object-contain"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Segmentation Mask</h3>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={result.mask_image}
              alt="Mask"
              className="w-full h-full object-contain"
            />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Overlay</h3>
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={result.overlay_image}
              alt="Overlay"
              className="w-full h-full object-contain"
            />
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Legend classes={result.classes} showStats={true} />
    </div>
  );
}
