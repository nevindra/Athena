import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  X,
  Search,
  Clock,
  Heart,
  Download,
  Trash2,
  Calendar
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface GeneratedImage {
  id: string;
  url: string;
  size: string;
  createdAt: Date;
}

interface Generation {
  id: string;
  prompt: string;
  images: GeneratedImage[];
  parameters: {
    count: number;
    size: string;
    style: string;
  };
  createdAt: Date;
}

interface ImageHistorySidebarProps {
  generations: Generation[];
  isOpen: boolean;
  onClose: () => void;
  onSelectGeneration: (generation: Generation) => void;
}

export function ImageHistorySidebar({ 
  generations, 
  isOpen, 
  onClose, 
  onSelectGeneration 
}: ImageHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "favorites">("newest");
  const [filterBy, setFilterBy] = useState<"all" | "favorites" | "recent">("all");
  const [favorites] = useState<Set<string>>(new Set()); // This would be managed globally

  // Filter and sort generations
  const filteredGenerations = generations
    .filter(generation => {
      // Search filter
      if (searchQuery) {
        return generation.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .filter(generation => {
      // Category filter
      switch (filterBy) {
        case "favorites":
          return generation.images.some(img => favorites.has(img.id));
        case "recent":
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return generation.createdAt > oneWeekAgo;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "favorites":
          const aHasFavorites = a.images.some(img => favorites.has(img.id));
          const bHasFavorites = b.images.some(img => favorites.has(img.id));
          if (aHasFavorites && !bHasFavorites) return -1;
          if (!aHasFavorites && bHasFavorites) return 1;
          return b.createdAt.getTime() - a.createdAt.getTime();
        default: // newest
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncatePrompt = (prompt: string, maxLength: number = 60) => {
    return prompt.length > maxLength ? prompt.slice(0, maxLength) + "..." : prompt;
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-border/30 bg-background/95 backdrop-blur-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Generation History
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(value: "all" | "favorites" | "recent") => setFilterBy(value)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All generations</SelectItem>
              <SelectItem value="recent">Recent (7 days)</SelectItem>
              <SelectItem value="favorites">Favorites only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: "newest" | "oldest" | "favorites") => setSortBy(value)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="favorites">Favorites first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredGenerations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No generations found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try different search terms</p>
              )}
            </div>
          ) : (
            filteredGenerations.map((generation) => (
              <div
                key={generation.id}
                className="group cursor-pointer rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-200 p-3"
                onClick={() => onSelectGeneration(generation)}
              >
                {/* Prompt */}
                <div className="mb-3">
                  <p className="text-sm font-medium leading-tight mb-1">
                    {truncatePrompt(generation.prompt)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(generation.createdAt)}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs py-0">
                      {generation.parameters.style}
                    </Badge>
                  </div>
                </div>

                {/* Image Thumbnails */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {generation.images.slice(0, 4).map((image, index) => (
                    <div
                      key={image.id}
                      className="aspect-square rounded bg-muted/30 overflow-hidden relative"
                    >
                      <img
                        src={image.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {generation.images.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            +{generation.images.length - 3}
                          </span>
                        </div>
                      )}
                      {favorites.has(image.id) && (
                        <div className="absolute top-1 right-1">
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Generation Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{generation.images.length} image{generation.images.length > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{generation.parameters.size}</span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download all images from this generation
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download all</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-destructive/10 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete generation
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/30 text-xs text-muted-foreground text-center">
        {filteredGenerations.length} of {generations.length} generations
      </div>
    </div>
  );
}