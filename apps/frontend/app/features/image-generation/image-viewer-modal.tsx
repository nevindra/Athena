import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  X,
  Download,
  Share2,
  Heart,
  Copy,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Info
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  size: string;
  createdAt: Date;
}

interface ImageViewerModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
}

export function ImageViewerModal({ image, onClose }: ImageViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (image) {
      setIsLoading(true);
      setZoom(1);
      // Simulate loading time
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [image]);

  if (!image) return null;

  const downloadImage = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const copyImageUrl = () => {
    navigator.clipboard.writeText(image.url);
    // Add toast notification here if needed
  };

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Generated Image',
          url: image.url,
        });
      } catch (error) {
        console.error('Sharing failed:', error);
        copyImageUrl();
      }
    } else {
      copyImageUrl();
    }
  };

  const openInNewTab = () => {
    window.open(image.url, '_blank');
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 4));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.25));
  const resetZoom = () => setZoom(1);

  const [width, height] = image.size.split('x').map(Number);
  const aspectRatio = width / height;
  
  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0 bg-black/95 border-none">
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            {/* Image Info */}
            <div className="flex items-center gap-3 text-white">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {image.size}
              </Badge>
              <span className="text-sm text-white/80">
                {image.createdAt.toLocaleString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInfo(!showInfo)}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle image info</TooltipContent>
              </Tooltip>

              <div className="h-6 w-px bg-white/20" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={zoomOut}
                    disabled={zoom <= 0.25}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom out</TooltipContent>
              </Tooltip>

              <div className="text-white text-sm font-medium min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={zoomIn}
                    disabled={zoom >= 4}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom in</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetZoom}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset zoom</TooltipContent>
              </Tooltip>

              <div className="h-6 w-px bg-white/20" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20"
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        isFavorite ? 'fill-red-500 text-red-500' : ''
                      }`} 
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={shareImage}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share image</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyImageUrl}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy URL</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openInNewTab}
                    className="h-9 w-9 p-0 text-white hover:bg-white/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in new tab</TooltipContent>
              </Tooltip>

              <div className="h-6 w-px bg-white/20" />

              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="h-9 px-3 text-white hover:bg-white/20 gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Container */}
        <div 
          className="flex items-center justify-center w-full h-full min-h-[70vh] overflow-auto p-16 pt-20"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div 
            className="relative transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <img
              src={image.url}
              alt="Generated image"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onLoad={() => setIsLoading(false)}
              style={{
                maxWidth: '80vw',
                maxHeight: '70vh',
              }}
            />
          </div>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
            <div className="max-w-2xl">
              <h3 className="text-white font-semibold mb-3">Image Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Resolution:</span>
                  <span className="text-white ml-2">{image.size} pixels</span>
                </div>
                <div>
                  <span className="text-white/60">Aspect Ratio:</span>
                  <span className="text-white ml-2">
                    {aspectRatio > 1 ? 'Landscape' : aspectRatio < 1 ? 'Portrait' : 'Square'}
                    {' '}({aspectRatio.toFixed(2)}:1)
                  </span>
                </div>
                <div>
                  <span className="text-white/60">Created:</span>
                  <span className="text-white ml-2">{image.createdAt.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-white/60">File ID:</span>
                  <span className="text-white ml-2 font-mono text-xs">{image.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}