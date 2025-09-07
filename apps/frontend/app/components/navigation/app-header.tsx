import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Clock, Plus, Share } from "lucide-react";
import { useNavigate } from "react-router";

interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItemData[];
  className?: string;
  showHistoryToggle?: boolean;
  onHistoryToggle?: () => void;
  isHistoryOpen?: boolean;
}

export function AppHeader({ 
  breadcrumbs, 
  className, 
  showHistoryToggle, 
  onHistoryToggle, 
  isHistoryOpen 
}: AppHeaderProps) {
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate("/");
  };

  const handleShare = () => {
    // Share functionality to be implemented later
    console.log("Share clicked");
  };
  return (
    <header
      className={`flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${className || ""}`}
    >
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                    <BreadcrumbItem
                      className={index === 0 ? "hidden md:block" : ""}
                    >
                      {item.isCurrentPage ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href || "#"}>
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* New Chat Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNewChat}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>

          {/* Share Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* History Toggle */}
          {showHistoryToggle && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onHistoryToggle}
              className={`flex items-center gap-2 ${isHistoryOpen ? 'bg-muted' : ''}`}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
