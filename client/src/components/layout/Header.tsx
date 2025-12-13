"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Brain } from "lucide-react";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";

export default function PublicHeader() {
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith("/auth/");
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="shadow-xs border-b">
      <div className="flex h-16 mx-auto justify-evenly px-30">
        <NavigationMenu className="w-10 ">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/"
                className={`flex flex-row  gap-2 items-center ${navigationMenuTriggerStyle()}`}
              >
                <Brain className="w-6 h-6 text-blue-500" />
                AI Hub
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/chat" className={navigationMenuTriggerStyle()}>
                Chat
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/comparison" className={navigationMenuTriggerStyle()}>
                Comparison
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/projects" className={navigationMenuTriggerStyle()}>
                Projects
              </NavigationMenuLink>
            </NavigationMenuItem>
            {/* <NavigationMenuItem>
              <NavigationMenuLink href="/tracking" className={navigationMenuTriggerStyle()}>
                Tracking
              </NavigationMenuLink>
            </NavigationMenuItem> */}
          </NavigationMenuList>
        </NavigationMenu>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/auth/login" className={navigationMenuTriggerStyle()}>
                Login
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="/auth/signup" className="bg-transparent hover:bg-transparent">
                <Button variant="secondary">Get Started</Button>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}
