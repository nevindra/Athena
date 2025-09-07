import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Download, 
  Share2, 
  Heart, 
  Copy, 
  History,
  Sparkles,
  ImageIcon,
  ChevronLeft,
  ChevronRight
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

interface ImageGalleryProps {
  images: GeneratedImage[];
  onImageClick: (image: GeneratedImage) => void;
  isGenerating: boolean;
  onHistoryToggle: () => void;
  isHistoryOpen: boolean;
}

export function ImageGallery({ 
  images, 
  onImageClick, 
  isGenerating, 
  onHistoryToggle,
  isHistoryOpen
}: ImageGalleryProps) {
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const toggleFavorite = (imageId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId);
      } else {
        newFavorites.add(imageId);
      }
      return newFavorites;
    });
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const copyImageUrl = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
    // You could add a toast notification here
  };

  const shareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          url: imageUrl,
        });
      } catch (error) {
        console.error('Sharing failed:', error);
      }
    } else {
      copyImageUrl(imageUrl);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(1, images.length));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + Math.max(1, images.length)) % Math.max(1, images.length));
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  // Reset carousel when new images are generated
  useState(() => {
    setCurrentImageIndex(0);
  }, [images.length]);

  // Loading placeholder for generation
  const LoadingPlaceholder = ({ index }: { index: number }) => (
    <div 
      className="aspect-square bg-muted/50 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center relative overflow-hidden"
      style={{ animationDelay: `${index * 200}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <div className="text-sm font-medium">Generating...</div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Gallery Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generated Images
          </div>
          {images.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {images.length} image{images.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onHistoryToggle}
          className={`gap-2 transition-colors ${
            isHistoryOpen ? 'bg-muted' : ''
          }`}
        >
          <History className="h-4 w-4" />
          History
        </Button>
      </div>

      {/* Gallery Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {/* Empty State */}
        {images.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No images generated yet</h3>
            <p className="text-muted-foreground max-w-md">
              Enter a prompt below and click "Generate Image" to create your first AI-generated image.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && images.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center">
            <LoadingPlaceholder index={0} />
            <p className="text-muted-foreground mt-4">Creating your images...</p>
          </div>
        )}

        {/* Carousel */}
        {images.length > 0 && (
          <div className="w-full max-w-4xl mx-auto">
            {/* Main Image Display */}
            <div className="relative">
              <div className="flex justify-center">
                <div
                  className="group relative cursor-pointer max-w-lg"
                  onMouseEnter={() => setHoveredImage(images[currentImageIndex]?.id)}
                  onMouseLeave={() => setHoveredImage(null)}
                  onClick={() => onImageClick(images[currentImageIndex])}
                >
                  <div className="aspect-square relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                    {images[currentImageIndex] && (
                      <>
                        <img
                          src={images[currentImageIndex].url}
                          alt="Generated image"
                          className="w-full h-full object-cover transition-transform duration-300"
                          loading="lazy"
                        />
                        
                        {/* Resolution Badge Overlay */}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="text-sm bg-black/80 text-white border-none backdrop-blur-sm px-3 py-1">
                            {images[currentImageIndex].size}
                          </Badge>
                        </div>
                        
                        {/* Hover Overlay */}
                        <div 
                          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
                            hoveredImage === images[currentImageIndex].id ? 'opacity-100' : 'opacity-0'
                          }`}
                        >
                          <div className="absolute inset-0 p-4 flex flex-col justify-between">
                            {/* Top Actions */}
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-black"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(images[currentImageIndex].id);
                                    }}
                                  >
                                    <Heart 
                                      className={`h-5 w-5 ${
                                        favorites.has(images[currentImageIndex].id) 
                                          ? 'fill-red-500 text-red-500' 
                                          : ''
                                      }`} 
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {favorites.has(images[currentImageIndex].id) ? 'Remove from favorites' : 'Add to favorites'}
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            {/* Bottom Actions */}
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1 bg-white/90 hover:bg-white text-black gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadImage(images[currentImageIndex].url, `generated-image-${images[currentImageIndex].id}.png`);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download image</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-black"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      shareImage(images[currentImageIndex].url);
                                    }}
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Share image</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-10 w-10 p-0 bg-white/90 hover:bg-white text-black"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyImageUrl(images[currentImageIndex].url);
                                    }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy URL</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-lg"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-lg"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Image Info */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <span className="text-muted-foreground text-sm">
                  {images[currentImageIndex]?.createdAt.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {images.length > 1 && (
                  <span className="text-muted-foreground text-sm">
                    {currentImageIndex + 1} of {images.length}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails/Dots */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-primary scale-110'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}