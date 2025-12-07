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
    <Card className="overflow-hidden">
      <div className="bg-muted/30 p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {displayClasses.map((classInfo) => (
            <div
              key={classInfo.id}
              className="flex items-center gap-2 p-2 bg-background rounded border hover:border-primary/50 transition-colors"
            >
              <div
                className="w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: classInfo.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium capitalize truncate">
                  {classInfo.name.replace('_', ' ')}
                </div>
                {showStats && classInfo.area_percent !== undefined && (
                  <div className="text-xs text-muted-foreground">
                    {classInfo.area_percent.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
