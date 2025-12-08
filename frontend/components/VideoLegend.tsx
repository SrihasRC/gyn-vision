/**
 * Dynamic legend component for video results showing class colors
 */
'use client';

import { Card } from '@/components/ui/card';
import { ClassInfo } from '@/lib/types';

interface VideoLegendProps {
  classes?: ClassInfo[];
}

export function VideoLegend({ classes }: VideoLegendProps) {
  // Default 4-class configuration for backward compatibility
  const defaultClasses = [
    { id: 1, name: 'Uterus', color: '#0000FF' },
    { id: 2, name: 'Fallopian Tube', color: '#00FF00' },
    { id: 3, name: 'Ovary', color: '#A020F0' },
  ];

  // Use provided classes or default, filter out background
  const displayClasses = (classes || defaultClasses).filter(c => c.id !== 0);

  return (
    <Card className="overflow-hidden mt-4">
      <div className="bg-muted/30 p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Color Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {displayClasses.map((classInfo) => (
            <div
              key={classInfo.id}
              className="flex items-center gap-2 p-2 bg-background rounded border"
            >
              <div
                className="w-4 h-4 rounded shrink-0 border"
                style={{ backgroundColor: classInfo.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium capitalize truncate">
                  {classInfo.name.replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
