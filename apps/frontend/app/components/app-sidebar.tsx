"use client";

import {
  BookOpen,
  Bot,
  Home,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/navigation/nav-main";
import { NavChatHistory } from "@/components/navigation/nav-projects";
import { NavUser } from "@/components/navigation/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "~/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
  },
  navMain: [
    {
      title: "Configuration",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Model Configuration",
          url: "/models",
        },
        {
          title: "System Prompt",
          url: "/system-prompts",
        },
      ],
    },
    {
      title: "Knowledge Base",
      url: "#",
      icon: BookOpen,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center gap-2 p-4">
        <SidebarTrigger className="-ml-1.5"/>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap">AthenaAI</span>
            <span className="text-xs text-sidebar-foreground/60 whitespace-nowrap">by Nodeflux</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Home" asChild>
                <a href="/">
                  <Home />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavMain items={data.navMain} />
        <NavChatHistory />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
