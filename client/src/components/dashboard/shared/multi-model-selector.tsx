"use client";

import React, { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MODELS } from "@shared/config/models";

interface MultiModelSelectorProps {
  selectedModelIds: string[];
  onModelToggle: (modelId: string) => void;
  maxModels?: number;
  className?: string;
}

export function MultiModelSelector({
  selectedModelIds,
  onModelToggle,
  maxModels = 3,
  className,
}: MultiModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const availableModels = Object.entries(MODELS);
  const selectedModels = selectedModelIds.map((id) => MODELS[id]).filter(Boolean);

  const canAddMore = selectedModelIds.length < maxModels;

  const handleModelToggle = (modelId: string) => {
    onModelToggle(modelId);
  };

  const removeModel = (modelId: string) => {
    onModelToggle(modelId);
  };

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {/* Selected Models Display */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedModels.map((model) => (
            <Badge key={model.id} variant="secondary" className="flex items-center gap-1">
              {model.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeModel(model.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Model Selection Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between" disabled={!canAddMore}>
            <span>
              {selectedModelIds.length === 0
                ? "Select models to compare"
                : canAddMore
                  ? `Add model (${selectedModelIds.length}/${maxModels})`
                  : `Maximum ${maxModels} models selected`}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[300px]" align="start">
          {availableModels.map(([modelId, model]) => {
            const isSelected = selectedModelIds.includes(modelId);
            const isDisabled = !isSelected && !canAddMore;

            return (
              <DropdownMenuItem
                key={modelId}
                className="flex items-center justify-between cursor-pointer"
                disabled={isDisabled}
                onClick={() => handleModelToggle(modelId)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.provider} • {model.description}
                  </span>
                </div>
                {isSelected && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedModelIds.length < 2 && (
        <p className="text-xs text-muted-foreground">Select at least 2 models to start comparison</p>
      )}
    </div>
  );
}
