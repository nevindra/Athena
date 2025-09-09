import { useState } from "react";
import { AppHeader } from "~/components/navigation/app-header";
import { ImageUploadZone } from "@/features/ocr-reader/image-upload-zone";
import { StructuredOutputConfig } from "@/features/ocr-reader/structured-output-config";
import { OcrResultsDisplay } from "@/features/ocr-reader/ocr-results-display";
import { OcrHistorySidebar } from "@/features/ocr-reader/ocr-history-sidebar";
import type { OcrResult, OutputStructure } from "@/features/ocr-reader/types";

// Mock OCR results for demonstration
const mockOcrResults: OcrResult[] = [
  {
    id: "1",
    originalImage: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop",
    fileName: "business-card.jpg",
    rawText: "John Smith\nSenior Developer\nTech Solutions Inc.\n+1 (555) 123-4567\njohn.smith@techsolutions.com\nwww.techsolutions.com",
    structuredData: {
      name: "John Smith",
      title: "Senior Developer",
      company: "Tech Solutions Inc.",
      phone: "+1 (555) 123-4567",
      email: "john.smith@techsolutions.com",
      website: "www.techsolutions.com"
    },
    outputStructure: {
      name: "Business Card",
      fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "title", label: "Job Title", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "phone", label: "Phone", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "website", label: "Website", type: "url" }
      ]
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "2",
    originalImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop",
    fileName: "invoice.png",
    rawText: "INVOICE #INV-001\nDate: 2024-01-15\nTo: ABC Company\nAmount: $1,250.00\nDue Date: 2024-02-15\nDescription: Web Development Services",
    structuredData: {
      invoice_number: "INV-001",
      date: "2024-01-15",
      client: "ABC Company",
      amount: "$1,250.00",
      due_date: "2024-02-15",
      description: "Web Development Services"
    },
    outputStructure: {
      name: "Invoice",
      fields: [
        { key: "invoice_number", label: "Invoice Number", type: "text" },
        { key: "date", label: "Date", type: "date" },
        { key: "client", label: "Client", type: "text" },
        { key: "amount", label: "Amount", type: "currency" },
        { key: "due_date", label: "Due Date", type: "date" },
        { key: "description", label: "Description", type: "text" }
      ]
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  }
];

export default function OcrReader() {
  const [ocrResults, setOcrResults] = useState<OcrResult[]>(mockOcrResults);
  const [currentResult, setCurrentResult] = useState<OcrResult | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputStructure, setOutputStructure] = useState<OutputStructure>({
    name: "Custom Structure",
    fields: []
  });

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "OCR Reader", isCurrentPage: true },
  ];

  const handleImageUpload = async (file: File) => {
    setIsProcessing(true);
    
    // Simulate OCR processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Create mock OCR result
    const mockResult: OcrResult = {
      id: Date.now().toString(),
      originalImage: URL.createObjectURL(file),
      fileName: file.name,
      rawText: "Sample extracted text from the uploaded image...\nThis would contain the actual OCR results.",
      structuredData: outputStructure.fields.length > 0 ? 
        outputStructure.fields.reduce((acc, field) => ({
          ...acc,
          [field.key]: `Sample ${field.label.toLowerCase()}`
        }), {}) : {},
      outputStructure,
      createdAt: new Date(),
    };

    setOcrResults(prev => [mockResult, ...prev]);
    setCurrentResult(mockResult);
    setIsProcessing(false);
  };

  const handleStructureChange = (structure: OutputStructure) => {
    setOutputStructure(structure);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader breadcrumbs={breadcrumbs} />

        {/* Content Area */}
        <div className="flex-1 flex overflow-auto">
          {/* Left Panel - Upload and Configuration */}
          <div className="flex-1 flex flex-col min-w-0 max-w-2xl">
            {/* Image Upload Zone */}
            <div className="p-6 border-b border-border/30">
              <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
              <ImageUploadZone 
                onImageUpload={handleImageUpload}
                isProcessing={isProcessing}
              />
            </div>

            {/* Output Structure Configuration */}
            <div className="flex-1 p-6">
              <h2 className="text-lg font-semibold mb-4">Configure Output Structure</h2>
              <StructuredOutputConfig
                outputStructure={outputStructure}
                onStructureChange={handleStructureChange}
              />
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 flex flex-col border-l border-border/30 min-w-0">
            {/* Results Display */}
            <div className="flex-1">
              <OcrResultsDisplay
                result={currentResult}
                isProcessing={isProcessing}
                onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
                isHistoryOpen={isHistoryOpen}
              />
            </div>
          </div>

          {/* History Panel */}
          <OcrHistorySidebar
            results={ocrResults}
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectResult={(result) => {
              setCurrentResult(result);
              setOutputStructure(result.outputStructure);
            }}
          />
        </div>
      </div>
    </div>
  );
}