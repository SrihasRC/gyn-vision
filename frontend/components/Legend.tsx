/**
 * Legend component to display class colors and statistics
 */
'use client';

import { ClassInfo } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface LegendProps {
  classes: ClassInfo[];
  showStats?: boolean;
}

export function Legend({ classes, showStats = true }: LegendProps) {
  // Filter out background for cleaner display
  const displayClasses = classes.filter(c => c.id !== 0);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">Class Legend</h3>
      <div className="space-y-2">
        {displayClasses.map((classInfo) => (
          <div
            key={classInfo.id}
            className="flex items-center gap-3 text-sm"
          >
            <div
              className="w-5 h-5 rounded border-2 border-border shrink-0"
              style={{ backgroundColor: classInfo.color }}
            />
            <div className="flex-1">
              <span className="font-medium capitalize">
                {classInfo.name.replace('_', ' ')}
              </span>
              {showStats && classInfo.area_percent !== undefined && (
                <span className="text-muted-foreground ml-2">
                  {classInfo.area_percent}%
                </span>
              )}
              {showStats && classInfo.frames_present !== undefined && (
                <span className="text-muted-foreground ml-2">
                  ({classInfo.frames_present} frames)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
