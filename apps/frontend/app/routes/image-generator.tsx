import { ImageGallery } from "@/features/image-generation/image-gallery";
import { ImageHistorySidebar } from "@/features/image-generation/image-history-sidebar";
import { ImagePromptInput } from "@/features/image-generation/image-prompt-input";
import { ImageViewerModal } from "@/features/image-generation/image-viewer-modal";
import { useState } from "react";
import { AppHeader } from "~/components/navigation/app-header";

// Mock image URLs for different themes
const mockImagePools = {
  landscape: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e",
    "https://images.unsplash.com/photo-1464822759844-d150ad6abb98",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1500622944204-b135684e99fd",
  ],
  abstract: [
    "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d",
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    "https://images.unsplash.com/photo-1557672172-298e090bd0f1",
    "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead",
  ],
  cyberpunk: [
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
    "https://images.unsplash.com/photo-1493723843671-1d655e66ac1c",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176",
  ],
  portrait: [
    "https://images.unsplash.com/photo-1494790108755-2616b332c1a7",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
  ],
  architecture: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
    "https://images.unsplash.com/photo-1448630360428-65456885c650",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000",
    "https://images.unsplash.com/photo-1511818966892-d7d671e672a2",
  ],
};

// Function to get mock image URL based on style and size
const getMockImageUrl = (style: string, size: string) => {
  const [width, height] = size.split('x');
  let pool = mockImagePools.abstract; // default

  const styleMapping: { [key: string]: keyof typeof mockImagePools } = {
    'Photorealistic': 'landscape',
    'Abstract': 'abstract',
    'Cyberpunk': 'cyberpunk',
    'Artistic': 'portrait',
    'Minimalist': 'architecture',
    'Vintage': 'portrait',
  };

  if (styleMapping[style]) {
    pool = mockImagePools[styleMapping[style]];
  }

  const randomImage = pool[Math.floor(Math.random() * pool.length)];
  return `${randomImage}?w=${width}&h=${height}&fit=crop&auto=format`;
};

// Mock data for generated images
const mockGenerations = [
  {
    id: "1",
    prompt: "A serene mountain landscape at sunset with golden light",
    images: [
      {
        id: "img-1",
        url: getMockImageUrl("Photorealistic", "512x512"),
        size: "512x512",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: "img-2",
        url: getMockImageUrl("Photorealistic", "512x512"),
        size: "512x512",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
    parameters: {
      count: 2,
      size: "512x512",
      style: "Photorealistic",
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    prompt: "Abstract geometric pattern in vibrant colors",
    images: [
      {
        id: "img-3",
        url: getMockImageUrl("Abstract", "1024x1024"),
        size: "1024x1024",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ],
    parameters: {
      count: 1,
      size: "1024x1024",
      style: "Abstract",
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    prompt: "Futuristic cyberpunk cityscape with neon lights reflecting on wet streets",
    images: [
      {
        id: "img-4",
        url: getMockImageUrl("Cyberpunk", "1792x1024"),
        size: "1792x1024",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: "img-5",
        url: getMockImageUrl("Cyberpunk", "1792x1024"),
        size: "1792x1024",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: "img-6",
        url: getMockImageUrl("Cyberpunk", "1792x1024"),
        size: "1792x1024",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
    parameters: {
      count: 3,
      size: "1792x1024",
      style: "Cyberpunk",
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

type GeneratedImage = {
  id: string;
  url: string;
  size: string;
  createdAt: Date;
};

type Generation = {
  id: string;
  prompt: string;
  images: GeneratedImage[];
  parameters: {
    count: number;
    size: string;
    style: string;
  };
  createdAt: Date;
};

export default function ImageGenerator() {
  const [generations, setGenerations] = useState<Generation[]>(mockGenerations);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Image Generator", isCurrentPage: true },
  ];

  const handleGenerate = async (prompt: string, parameters: { count: number; size: string; style: string }) => {
    setIsGenerating(true);

    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create mock generated images
    const newImages: GeneratedImage[] = Array.from({ length: parameters.count }, (_, i) => ({
      id: `img-${Date.now()}-${i}`,
      url: getMockImageUrl(parameters.style, parameters.size),
      size: parameters.size,
      createdAt: new Date(),
    }));

    const newGeneration: Generation = {
      id: Date.now().toString(),
      prompt,
      images: newImages,
      parameters,
      createdAt: new Date(),
    };

    setGenerations(prev => [newGeneration, ...prev]);
    setIsGenerating(false);
  };

  const currentImages = generations.length > 0 ? generations[0].images : [];

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader breadcrumbs={breadcrumbs} />

        {/* Content Area */}
        <div className="flex-1 flex overflow-auto">
          {/* Left Panel - Gallery and Input */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Image Gallery */}
            <div className="flex-1">
              <ImageGallery
                images={currentImages}
                onImageClick={setSelectedImage}
                isGenerating={isGenerating}
                onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
              />
            </div>

            {/* Prompt Input - Fixed height */}
            <div className="flex-shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-sm">
              <div className="p-6">
                <ImagePromptInput
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - History */}
          <ImageHistorySidebar
            generations={generations}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectGeneration={(generation) => {
              // This would switch the main gallery to show this generation's images
              setGenerations(prev => [generation, ...prev.filter(g => g.id !== generation.id)]);
            }}
          />
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
