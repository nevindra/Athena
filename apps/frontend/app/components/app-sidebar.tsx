"use client";

import { BookOpen, Bot, Globe, Home, Image, ScanText, Workflow } from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/navigation/nav-main";
import { NavUser } from "@/components/navigation/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
      url: "/knowledge-base",
      icon: BookOpen,
    },
    {
      title: "Image Generator",
      url: "/image-generator",
      icon: Image,
    },
    {
      title: "OCR Reader",
      url: "/ocr-reader",
      icon: ScanText,
    },
    {
      title: "API Management",
      url: "#",
      icon: Globe,
      items: [
        {
          title: "Monitor APIs",
          url: "/management-api/monitor",
        },
        {
          title: "API History",
          url: "/management-api/history",
        },
      ],
    },
    {
      title: "Automation",
      url: "#",
      icon: Workflow,
      items: [
        {
          title: "Workflow Builder",
          url: "/automation/workflows",
        },
        {
          title: "Templates",
          url: "/automation/templates",
        },
        {
          title: "History",
          url: "/automation/history",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center gap-2 p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden overflow-hidden bg-card p-3 rounded-lg border shadow-sm w-full">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            A
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-card-foreground whitespace-nowrap">
              AthenaAI
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              by Nodeflux
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
          <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem className="relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <SidebarMenuButton
                tooltip="Home"
                asChild
                className="w-full justify-start px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/80 hover:scale-[1.02] active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0"
              >
                <a href="/" className="flex items-center">
                  <Home className="size-5 shrink-0 transition-colors duration-200 group-data-[collapsible=icon]:size-4" />
                  <span className="font-medium transition-all duration-200 group-data-[collapsible=icon]:sr-only">Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
