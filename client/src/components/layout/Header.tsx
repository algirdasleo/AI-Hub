"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Brain, Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme((prev: string) => (prev === "dark" ? "light" : "dark"));
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default function Header() {
  return (
    <nav className="shadow-xs border-b">
      <NavigationMenu className="h-16 w-full mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="/"
              className={`flex flex-row gap-2 items-center ${navigationMenuTriggerStyle()}`}
            >
              <Brain className="w-6 h-6 text-blue-500" />
              AI Hub
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem></NavigationMenuItem>
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
          <NavigationMenuItem>
            <NavigationMenuLink href="/tracking" className={navigationMenuTriggerStyle()}>
              Tracking
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
}
