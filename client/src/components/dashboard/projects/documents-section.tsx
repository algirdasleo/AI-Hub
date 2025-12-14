"use client";

import { useRef, useState } from "react";
import { Project, Document } from "@shared/types/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, Trash2, FileText, FileJson, FileCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/time-utils";

interface DocumentsSectionProps {
  project: Project;
  onAddDocuments: (documents: Document[]) => void;
  onDeleteDocument: (documentId: string) => void;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) {
    return FileText;
  }
  if (type === "application/pdf") {
    return FileText;
  }
  if (type.includes("json")) {
    return FileJson;
  }
  if (type.includes("text") || type.includes("markdown") || type === "application/x-yaml") {
    return FileCode;
  }
  return File;
}

export function DocumentsSection({ project, onAddDocuments, onDeleteDocument }: DocumentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDocuments: Document[] = Array.from(files).map((file) => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        type: file.type,
      }));

      onAddDocuments(newDocuments);
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 500);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-auto p-4">
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Upload Documents</CardTitle>
          <CardDescription>Drag and drop files or click to browse</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.txt,.md,.json,.csv,.doc,.docx,.xlsx,.ppt,.pptx"
          />
          <Button onClick={handleUploadClick} variant="outline" className="w-full gap-2" disabled={isUploading}>
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Choose Files"}
          </Button>
        </CardContent>
      </Card>
      {!project.documents.length ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No documents uploaded yet. Upload files to start chatting with your data.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-semibold">Uploaded Documents</h3>
          <div className="space-y-2">
            {project.documents.map((doc) => {
              const IconComponent = getFileIcon(doc.type);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(doc.size)} • {formatTimeAgo(new Date(doc.uploadedAt))}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDeleteDocument(doc.id)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
