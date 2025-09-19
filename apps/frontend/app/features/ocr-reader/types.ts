export interface StructureField {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "url" | "date" | "currency" | "phone";
  required?: boolean;
  description?: string;
}

export interface OutputStructure {
  name: string;
  description?: string;
  fields: StructureField[];
}

export interface OcrResult {
  id: string;
  originalImage: string;
  fileName: string;
  rawText: string;
  structuredData: Record<string, any>;
  outputStructure: OutputStructure;
  createdAt: Date;
  confidence?: number;
}

export interface OcrProcessingStatus {
  status: "idle" | "processing" | "completed" | "error";
  progress?: number;
  error?: string;
}

export interface OutputTemplate {
  id: string;
  name: string;
  description: string;
  structure: OutputStructure;
  category: "business" | "document" | "receipt" | "form" | "custom";
  isDefault?: boolean;
}

// Pre-defined templates for common use cases
export const defaultTemplates: OutputTemplate[] = [
  {
    id: "business-card",
    name: "Business Card",
    description: "Extract contact information from business cards",
    category: "business",
    isDefault: true,
    structure: {
      name: "Business Card",
      description: "Standard business card information extraction",
      fields: [
        { key: "name", label: "Full Name", type: "text", required: true },
        { key: "title", label: "Job Title", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "phone", label: "Phone Number", type: "phone" },
        { key: "email", label: "Email Address", type: "email" },
        { key: "website", label: "Website", type: "url" },
        { key: "address", label: "Address", type: "text" }
      ]
    }
  },
  {
    id: "invoice",
    name: "Invoice",
    description: "Extract key information from invoices",
    category: "document",
    isDefault: true,
    structure: {
      name: "Invoice",
      description: "Standard invoice information extraction",
      fields: [
        { key: "invoice_number", label: "Invoice Number", type: "text", required: true },
        { key: "date", label: "Invoice Date", type: "date", required: true },
        { key: "due_date", label: "Due Date", type: "date" },
        { key: "vendor", label: "Vendor/From", type: "text" },
        { key: "client", label: "Client/To", type: "text" },
        { key: "total_amount", label: "Total Amount", type: "currency", required: true },
        { key: "description", label: "Description/Items", type: "text" }
      ]
    }
  },
  {
    id: "receipt",
    name: "Receipt",
    description: "Extract information from purchase receipts",
    category: "receipt",
    isDefault: true,
    structure: {
      name: "Receipt",
      description: "Purchase receipt information extraction",
      fields: [
        { key: "merchant", label: "Merchant Name", type: "text", required: true },
        { key: "date", label: "Purchase Date", type: "date", required: true },
        { key: "total", label: "Total Amount", type: "currency", required: true },
        { key: "tax", label: "Tax Amount", type: "currency" },
        { key: "receipt_number", label: "Receipt Number", type: "text" },
        { key: "payment_method", label: "Payment Method", type: "text" }
      ]
    }
  },
  {
    id: "form",
    name: "Form Data",
    description: "Extract data from filled forms",
    category: "form",
    structure: {
      name: "Form Data",
      description: "General form data extraction",
      fields: [
        { key: "form_type", label: "Form Type", type: "text" },
        { key: "date", label: "Form Date", type: "date" },
        { key: "applicant_name", label: "Applicant Name", type: "text" },
        { key: "reference_number", label: "Reference Number", type: "text" }
      ]
    }
  }
];