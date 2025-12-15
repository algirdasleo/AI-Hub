"use client";

import { useState } from "react";
import { ArrowUpRight, Link, MoreHorizontal, StarOff, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProjectConversations } from "@/hooks/useProjectConversations";

interface NavProjectConversationsProps {
  projectId: string;
  onConversationSelect?: (conversationId: string) => void;
  selectedConversationId?: string;
}

export function NavProjectConversations({
  projectId,
  onConversationSelect,
  selectedConversationId,
}: NavProjectConversationsProps) {
  const { isMobile } = useSidebar();
  const { conversations, isLoading, error, deleteConversation } = useProjectConversations(projectId);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chat History</SidebarGroupLabel>
      <SidebarMenu>
        {/* Loading State */}
        {isLoading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SidebarMenuItem key={`loading-${i}`}>
                <SidebarMenuButton disabled>
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </>
        )}

        {/* Error State */}
        {error && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-destructive text-xs">
              <span>Failed to load chats</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Conversations List */}
        {!isLoading &&
          !error &&
          conversations.slice(0, showAll ? conversations.length : 6).map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <SidebarMenuButton
                onClick={() => onConversationSelect?.(conversation.id)}
                isActive={selectedConversationId === conversation.id}
                title={conversation.title}
              >
                <span className="truncate">{conversation.title}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <StarOff className="text-muted-foreground" />
                    <span>Remove from Favorites</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link className="text-muted-foreground" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUpRight className="text-muted-foreground" />
                    <span>Open in New Tab</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={deletingId === conversation.id}
                    onClick={async () => {
                      setDeletingId(conversation.id);
                      try {
                        await deleteConversation(conversation.id);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    <Trash2 className="text-muted-foreground" />
                    <span>{deletingId === conversation.id ? "Deleting..." : "Delete"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}

        {/* More Button */}
        {!isLoading && !error && conversations.length > 6 && (
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setShowAll(!showAll)} className="text-sidebar-foreground/70">
              <MoreHorizontal className="h-4 w-4" />
              <span>{showAll ? "Show Less" : `Show ${conversations.length - 6} More`}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Empty State */}
        {!isLoading && !error && conversations.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-muted-foreground text-xs">
              <span>No chats yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
