/**
 * Model selector dropdown component
 */
'use client';

import { Model } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  models: Model[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  selectedId,
  onSelect,
  disabled = false,
}: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Model</label>
      <Select value={selectedId} onValueChange={onSelect} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground">
                  {model.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
