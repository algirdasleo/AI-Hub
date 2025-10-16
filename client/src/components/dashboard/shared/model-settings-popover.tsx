"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";

export interface ModelSettings {
  temperature?: number;
  maxOutputTokens?: number;
}

interface ModelSettingsPopoverProps {
  settings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
  className?: string;
}

export function ModelSettingsPopover({ settings, onSettingsChange, className }: ModelSettingsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className={className}>
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Model Settings</h4>

          {/* Temperature Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-sm">
                Temperature
              </Label>
              <span className="text-xs text-muted-foreground">{settings.temperature ?? "0.7"}</span>
            </div>
            <Input
              id="temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature ?? ""}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  temperature: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="0.7"
            />
            <p className="text-xs text-muted-foreground">Controls randomness. Lower = more focused.</p>
          </div>

          {/* Max Tokens Setting */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens" className="text-sm">
                Max Output Tokens
              </Label>
              <span className="text-xs text-muted-foreground">{settings.maxOutputTokens ?? "Default"}</span>
            </div>
            <Input
              id="maxTokens"
              type="number"
              min="1"
              max="4096"
              value={settings.maxOutputTokens ?? ""}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  maxOutputTokens: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder="Model default"
            />
            <p className="text-xs text-muted-foreground">Maximum length of the response.</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
