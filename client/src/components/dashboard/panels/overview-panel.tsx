"use client";

import { MessageCircle, GitCompare, Folder } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureCard {
  title: string;
  url: string;
  icon: React.ComponentType<{ className: string }>;
  color: string;
  description: string;
  items: string[];
}

const features: FeatureCard[] = [
  {
    title: "Chat",
    url: "chat",
    icon: MessageCircle,
    color: "text-blue-500",
    description: "Start conversations with AI",
    items: ["Upload multiple document types", "Ask natural language questions", "Get contextual answers"],
  },
  {
    title: "Compare",
    url: "comparison",
    icon: GitCompare,
    color: "text-green-500",
    description: "Compare AI model responses",
    items: ["Test multiple AI models", "Side-by-side comparison", "Find the best fit for your needs"],
  },
  {
    title: "Projects",
    url: "projects",
    icon: Folder,
    color: "text-purple-500",
    description: "Organize your work",
    items: ["Create multiple projects", "Group related documents", "Track conversations by project"],
  },
];

interface OverviewPanelProps {
  onNavigate?: (to: string) => void;
}

export default function OverviewPanel({ onNavigate }: OverviewPanelProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold mt-5">Welcome to AI Hub</h1>
        <p className="text-muted-foreground">
          Chat with your documents using advanced AI models. Explore three powerful features designed to help you
          work smarter.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.url}
            onClick={() => onNavigate?.(feature.url)}
            className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-accent"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
                <CardTitle>{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {feature.title === "Chat"
                  ? "Upload your documents and have intelligent conversations with AI about their content. Ask questions, get summaries, and extract key information."
                  : feature.title === "Compare"
                    ? "Compare responses from different AI models side by side. See how various models handle the same questions about your documents."
                    : "Create and manage projects to keep your documents and conversations organized. Structure your work by topic or use case."}
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {feature.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
        <p className="text-sm font-medium">Get Started</p>
        <p className="text-sm text-muted-foreground">
          Choose Chat to begin uploading documents, or create a Project to organize your work.
        </p>
      </div>
    </div>
  );
}
