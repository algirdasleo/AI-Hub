"use client";

import { type LucideIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function NavMain({
  items,
  onNavigate,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
  }[];
  onNavigate?: (to: string) => void;
}) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "overview";

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = item.url === currentView;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive}>
              <a
                href={item.url}
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate(item.url);
                  }
                }}
              >
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
