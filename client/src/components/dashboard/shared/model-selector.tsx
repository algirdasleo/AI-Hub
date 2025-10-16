"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { MODELS } from "@shared/config/models";
import { AIProvider } from "@shared/config/model-schemas";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelSelect: (modelId: string) => void;
  className?: string;
}

export function ModelSelector({ selectedModelId, onModelSelect, className }: ModelSelectorProps) {
  const selectedModel = MODELS[selectedModelId];

  const modelsByProvider = Object.values(MODELS).reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<AIProvider, (typeof MODELS)[string][]>,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`min-w-[200px] justify-between ${className || ""}`}>
          <span className="truncate">{selectedModel?.name || "Select Model"}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        {Object.entries(modelsByProvider).map(([provider, models]) => (
          <div key={provider}>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
              {provider}
            </DropdownMenuLabel>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelSelect(model.id)}
                className="flex flex-col items-start py-2"
              >
                <span className="font-medium">{model.name}</span>
                {model.description && (
                  <span className="text-xs text-muted-foreground line-clamp-1">{model.description}</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
