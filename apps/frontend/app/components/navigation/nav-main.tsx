import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
      <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:sr-only">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem className="relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      tooltip={item.title}
                      isActive={item.isActive}
                      className="w-full justify-start px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/80 hover:scale-[1.02] active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0"
                    >
                      {item.icon && (
                        <item.icon className="size-5 shrink-0 transition-colors duration-200 group-data-[collapsible=icon]:size-4" />
                      )}
                      <span className="font-medium transition-all duration-200 group-data-[collapsible=icon]:sr-only">
                        {item.title}
                      </span>
                      <ChevronRight className="ml-auto size-4 shrink-0 transition-all duration-300 ease-out group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="transition-all duration-300 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                    <SidebarMenuSub className="ml-6 mt-2 space-y-1 border-l-2 border-sidebar-border/50 pl-4">
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild 
                            className="px-3 py-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/60 hover:translate-x-1 text-sm font-medium"
                          >
                            <a href={subItem.url} className="flex items-center">
                              <span className="relative">
                                {subItem.title}
                                <span className="absolute -left-6 top-1/2 size-1.5 rounded-full bg-sidebar-foreground/30 transition-all duration-200 group-hover:bg-sidebar-accent-foreground" />
                              </span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else {
            return (
              <SidebarMenuItem key={item.title} className="relative group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <SidebarMenuButton 
                  tooltip={item.title} 
                  isActive={item.isActive}
                  asChild 
                  className="w-full justify-start px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-sidebar-accent/80 hover:scale-[1.02] active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0"
                >
                  <a href={item.url} className="flex items-center">
                    {item.icon && (
                      <item.icon className="size-5 shrink-0 transition-colors duration-200 group-data-[collapsible=icon]:size-4" />
                    )}
                    <span className="font-medium transition-all duration-200 group-data-[collapsible=icon]:sr-only">
                      {item.title}
                    </span>
                    {item.isActive && (
                      <span className="absolute right-2 size-2 rounded-full bg-sidebar-accent-foreground transition-all duration-200 group-data-[collapsible=icon]:right-1" />
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
