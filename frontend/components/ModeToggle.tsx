/**
 * Mode toggle component for switching between image and video
 */
'use client';

import { Mode } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video } from 'lucide-react';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled = false }: ModeToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Mode</label>
      <Tabs
        value={mode}
        onValueChange={(value) => onChange(value as Mode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image" disabled={disabled} className="gap-2">
            <Image className="h-4 w-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video" disabled={disabled} className="gap-2">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
