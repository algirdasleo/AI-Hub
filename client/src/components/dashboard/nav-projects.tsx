"use client";

import React from "react";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Project } from "@shared/types/projects";
import { useProjects } from "@/hooks/useProjects";
import { useProjectConversations } from "@/hooks/useProjectConversations";

interface NavProjectsProps {
  onProjectSelect?: (projectId: string) => void;
  onConversationSelect?: (projectId: string, conversationId: string) => void;
  selectedProjectId?: string;
  selectedConversationId?: string;
}

export function NavProjects({
  onProjectSelect,
  onConversationSelect,
  selectedProjectId,
  selectedConversationId,
}: NavProjectsProps) {
  const { projects, isLoading, deleteProject } = useProjects([]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch {
      // Handle error silently
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading && (
          <>
            {Array.from({ length: 2 }).map((_, i) => (
              <SidebarMenuItem key={`loading-${i}`}>
                <SidebarMenuButton disabled>
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </>
        )}

        {!isLoading &&
          projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              onProjectSelect={onProjectSelect}
              onConversationSelect={onConversationSelect}
              selectedProjectId={selectedProjectId}
              selectedConversationId={selectedConversationId}
              onDeleteProject={handleDeleteProject}
            />
          ))}

        {!isLoading && projects.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-muted-foreground text-xs">
              <span>No projects yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

interface ProjectItemProps {
  project: Project;
  onProjectSelect?: (projectId: string) => void;
  onConversationSelect?: (projectId: string, conversationId: string) => void;
  selectedProjectId?: string;
  selectedConversationId?: string;
  onDeleteProject: (projectId: string) => void;
}

function ProjectItem({
  project,
  onProjectSelect,
  onConversationSelect,
  selectedProjectId,
  selectedConversationId,
  onDeleteProject,
}: ProjectItemProps) {
  const {
    conversations,
    isLoading: isLoadingConversations,
    deleteConversation,
  } = useProjectConversations(project.id);
  const [deletingProjectId, setDeletingProjectId] = React.useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = React.useState<string | null>(null);

  const topConversations = conversations.slice(0, 5);

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProjectId(projectId);
    try {
      await onDeleteProject(projectId);
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    setDeletingConversationId(conversationId);
    try {
      await deleteConversation(conversationId);
    } finally {
      setDeletingConversationId(null);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => onProjectSelect?.(project.id)}
        isActive={selectedProjectId === project.id && !selectedConversationId}
        title={project.name}
      >
        <span className="truncate">{project.name}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleDeleteProject(project.id)}
            disabled={deletingProjectId === project.id}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deletingProjectId === project.id ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!isLoadingConversations && topConversations.length > 0 && (
        <SidebarMenu className="ml-2 mt-1">
          {topConversations.map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <SidebarMenuButton
                size="sm"
                onClick={() => {
                  onProjectSelect?.(project.id);
                  onConversationSelect?.(project.id, conversation.id);
                }}
                isActive={selectedConversationId === conversation.id}
                className="text-xs py-1"
                title={conversation.title}
              >
                <span className="truncate text-xs">{conversation.title}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleDeleteConversation(conversation.id)}
                    disabled={deletingConversationId === conversation.id}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deletingConversationId === conversation.id ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}

      {isLoadingConversations && (
        <SidebarMenu className="ml-2 mt-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <SidebarMenuItem key={`loading-conv-${i}`}>
              <SidebarMenuButton disabled size="sm" className="py-1">
                <Skeleton className="h-3 w-3 rounded" />
                <Skeleton className="h-3 flex-1" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarMenuItem>
  );
}
