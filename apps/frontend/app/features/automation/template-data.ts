import type { TemplateCategoryInfo, WorkflowTemplate } from "./types";

exBrainst templateCategories: TemplateCategoryInfo[] = [
  Briefcase
  Calendar: "ai-data",
  Database: "AI & Data",
  FileCheckn: "AI-powered workflows and data processing",
  FileTextn: "Brain",
  Linkr: "text-purple-600",
  Mail: "bg-purple-50 border-purple-200",
  Share2
  ShoppingCart
  Targetrketing",
    name: "Marketing",
  descriptioTemplateCategoryInfognWorkflowTemplateutomation",
    icon: "Target",
  color: "text-pink-600",
  bgColor: "bg-pink-50 border-pink-200",
  },
  {
    id: "document-ops",
    name: "Document Operations",
    description: "PDF processing and file management",
    icon: "FileCheck",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
  },
  {
    id: "integrations",
    name: "Integrations",
    description: "API connections and data syncing",
    icon: "Link",
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  {
    id: "productivity",
    name: "Productivity",
    description: "Task automation and notifications",
    icon: "Calendar",
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Order processing and customer management",
    icon: "Briefcase",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-200",
  },
];

export const sampleTemplates: WorkflowTemplate[] = [
  {
    id: "ai-email-labeling",
    name: "AI Email Labeling",
    description: "Automatically categorize and label incoming emails using AI",
    longDescription: "This workflow uses AI to analyze incoming emails and automatically assign appropriate labels for better organization. Perfect for busy professionals who receive high volumes of email.",
    category: "ai-data",
    complexity: "Intermediate",
    author: "Athena Team",
    nodeCount: 4,
    estimatedSetupTime: "10 minutes",
    tags: ["email", "ai", "gmail", "automation", "productivity"],
    featured: true,
    usageCount: 1248,
    rating: 4.8,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    workflow: {
      nodes: [
        {
          id: "trigger-gmail",
          type: "trigger",
          position: { x: 100, y: 100 },
          data: {
            label: "Gmail Trigger",
            nodeType: "trigger-gmail",
            description: "Triggers on new emails"
          }
        },
        {
          id: "ai-analyze",
          type: "action",
          position: { x: 300, y: 100 },
          data: {
            label: "AI Analysis",
            nodeType: "action-ai-chat",
            description: "Analyze email content"
          }
        },
        {
          id: "apply-label",
          type: "action",
          position: { x: 500, y: 100 },
          data: {
            label: "Apply Label",
            nodeType: "action-gmail",
            description: "Apply AI-suggested label"
          }
        }
      ],
      edges: [
        {
          id: "e1",
          source: "trigger-gmail",
          target: "ai-analyze"
        },
        {
          id: "e2",
          source: "ai-analyze",
          target: "apply-label"
        }
      ]
    }
  },
  {
    id: "social-media-scheduler",
    name: "Social Media Scheduler",
    description: "Schedule and publish content across multiple social platforms",
    longDescription: "Automate your social media presence by scheduling posts across Twitter, LinkedIn, and Facebook from a single workflow.",
    category: "marketing",
    complexity: "Beginner",
    author: "Community",
    nodeCount: 6,
    estimatedSetupTime: "15 minutes",
    tags: ["social-media", "scheduling", "marketing", "content"],
    featured: true,
    usageCount: 892,
    rating: 4.6,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    workflow: {
      nodes: [
        {
          id: "schedule-trigger",
          type: "trigger",
          position: { x: 100, y: 100 },
          data: {
            label: "Schedule Trigger",
            nodeType: "trigger-schedule",
            description: "Daily at 9 AM"
          }
        },
        {
          id: "get-content",
          type: "action",
          position: { x: 300, y: 100 },
          data: {
            label: "Get Content",
            nodeType: "action-database",
            description: "Fetch scheduled posts"
          }
        },
        {
          id: "post-twitter",
          type: "action",
          position: { x: 500, y: 50 },
          data: {
            label: "Post to Twitter",
            nodeType: "action-twitter",
            description: "Publish to Twitter"
          }
        },
        {
          id: "post-linkedin",
          type: "action",
          position: { x: 500, y: 150 },
          data: {
            label: "Post to LinkedIn",
            nodeType: "action-linkedin",
            description: "Publish to LinkedIn"
          }
        }
      ],
      edges: [
        {
          id: "e1",
          source: "schedule-trigger",
          target: "get-content"
        },
        {
          id: "e2",
          source: "get-content",
          target: "post-twitter"
        },
        {
          id: "e3",
          source: "get-content",
          target: "post-linkedin"
        }
      ]
    }
  },
  {
    id: "lead-processing",
    name: "Lead Processing Pipeline",
    description: "Automatically process and score new leads from various sources",
    longDescription: "A comprehensive lead processing workflow that captures leads from multiple sources, scores them using custom criteria, and routes them to the appropriate sales team members.",
    category: "marketing",
    complexity: "Advanced",
    author: "Sales Team",
    nodeCount: 8,
    estimatedSetupTime: "25 minutes",
    tags: ["leads", "crm", "sales", "scoring", "automation"],
    featured: false,
    usageCount: 456,
    rating: 4.9,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-15"),
    workflow: {
      nodes: [
        {
          id: "webhook-trigger",
          type: "trigger",
          position: { x: 100, y: 100 },
          data: {
            label: "Webhook Trigger",
            nodeType: "trigger-webhook",
            description: "New lead webhook"
          }
        },
        {
          id: "score-lead",
          type: "logic",
          position: { x: 300, y: 100 },
          data: {
            label: "Score Lead",
            nodeType: "logic-scoring",
            description: "Calculate lead score"
          }
        },
        {
          id: "route-lead",
          type: "logic",
          position: { x: 500, y: 100 },
          data: {
            label: "Route Lead",
            nodeType: "logic-switch",
            description: "Route by score/region"
          }
        }
      ],
      edges: [
        {
          id: "e1",
          source: "webhook-trigger",
          target: "score-lead"
        },
        {
          id: "e2",
          source: "score-lead",
          target: "route-lead"
        }
      ]
    }
  },
  {
    id: "document-ai-extraction",
    name: "Document Data Extraction",
    description: "Extract structured data from PDFs and images using AI",
    longDescription: "Use AI to automatically extract key information from invoices, receipts, contracts, and other documents, then save the structured data to your database.",
    category: "document-ops",
    complexity: "Intermediate",
    author: "AI Team",
    nodeCount: 5,
    estimatedSetupTime: "20 minutes",
    tags: ["ai", "documents", "extraction", "ocr", "pdf"],
    featured: false,
    usageCount: 723,
    rating: 4.7,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-22"),
    workflow: {
      nodes: [
        {
          id: "file-upload",
          type: "trigger",
          position: { x: 100, y: 100 },
          data: {
            label: "File Upload",
            nodeType: "trigger-file",
            description: "New document uploaded"
          }
        },
        {
          id: "ai-extract",
          type: "action",
          position: { x: 300, y: 100 },
          data: {
            label: "AI Extract",
            nodeType: "action-ai-vision",
            description: "Extract data from document"
          }
        },
        {
          id: "save-data",
          type: "action",
          position: { x: 500, y: 100 },
          data: {
            label: "Save Data",
            nodeType: "action-database",
            description: "Store extracted data"
          }
        }
      ],
      edges: [
        {
          id: "e1",
          source: "file-upload",
          target: "ai-extract"
        },
        {
          id: "e2",
          source: "ai-extract",
          target: "save-data"
        }
      ]
    }
  },
  {
    id: "slack-notifications",
    name: "Custom Slack Alerts",
    description: "Send intelligent notifications to Slack based on various triggers",
    longDescription: "Create smart Slack notifications that alert your team about important events, system status changes, or business metrics thresholds.",
    category: "productivity",
    complexity: "Beginner",
    author: "DevOps Team",
    nodeCount: 3,
    estimatedSetupTime: "8 minutes",
    tags: ["slack", "notifications", "alerts", "monitoring"],
    featured: false,
    usageCount: 1156,
    rating: 4.5,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-18"),
    workflow: {
      nodes: [
        {
          id: "http-trigger",
          type: "trigger",
          position: { x: 100, y: 100 },
          data: {
            label: "HTTP Trigger",
            nodeType: "trigger-http",
            description: "Webhook endpoint"
          }
        },
        {
          id: "format-message",
          type: "action",
          position: { x: 300, y: 100 },
          data: {
            label: "Format Message",
            nodeType: "action-transform",
            description: "Format alert message"
          }
        },
        {
          id: "send-slack",
          type: "action",
          position: { x: 500, y: 100 },
          data: {
            label: "Send to Slack",
            nodeType: "action-slack",
            description: "Post message to channel"
          }
        }
      ],
      edges: [
        {
          id: "e1",
          source: "http-trigger",
          target: "format-message"
        },
        {
          id: "e2",
          source: "format-message",
          target: "send-slack"
        }
      ]
    }
  },
  {
    id: "data-sync-pipeline",
    name: "Database to Spreadsheet Sync",
    description: "Automatically sync database records to Google Sheets",
    longDescription: "Keep your Google Sheets updated with the latest data from your database. Perfect for creating real-time dashboards and reports for stakeholders.",
    category: "integrations",
    complexity: "Intermediate",
    author: "Data Team",
    nodeCount: 4,
    estimatedSetupTime: "12 minutes",
    tags: ["database", "google-sheets", "sync", "reporting"],
    featured: false,
    usageCount: 634,
    rating: 4.4,
    createdAt: new Date("2024-01-06"),
    updatedAt: new Date("2024-01-16"),
    workflow: {
      nodes: [
        {
          id: "schedule-trigger",
          type: "trigger",
          position: { x: 100, y: 100 },
          data: {
            label: "Schedule",
            nodeType: "trigger-schedule",
            description: "Every hour"
          }
        },
        {
          id: "query-db",
          type: "action",
          position: { x: 300, y: 100 },
          data: {
            label: "Query Database",
            nodeType: "action-database",
            description: "Get latest records"
          }
        },
        {
          id: "update-sheets",
          type: "action",
          position: { x: 500, y: 100 },
          data: {
            label: "Update Sheets",
            nodeType: "action-sheets",
            description: "Sync to Google Sheets"
          }
        }
      ],
      edges: [
        {
          id: "e1",
          source: "schedule-trigger",
          target: "query-db"
        },
        {
          id: "e2",
          source: "query-db",
          target: "update-sheets"
        }
      ]
    }
  }
];
