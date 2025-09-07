"use client";

import { 
  Brain,
  Target,
  FileCheck,
  Link,
  Calendar,
  Briefcase,
  Eye,
  Download,
  Star,
  Clock,
  User,
  Activity
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import type { WorkflowTemplate } from "./types";

interface TemplateCardProps {
  template: WorkflowTemplate;
  onUseTemplate: (template: WorkflowTemplate) => void;
  onPreviewTemplate: (template: WorkflowTemplate) => void;
}

const categoryIcons = {
  "ai-data": Brain,
  "marketing": Target,
  "document-ops": FileCheck,
  "integrations": Link,
  "productivity": Calendar,
  "ecommerce": Briefcase,
};

const complexityColors = {
  "Beginner": "bg-green-100 text-green-800 border-green-300",
  "Intermediate": "bg-yellow-100 text-yellow-800 border-yellow-300", 
  "Advanced": "bg-red-100 text-red-800 border-red-300",
};

const categoryColors = {
  "ai-data": "border-purple-200 bg-purple-50/50",
  "marketing": "border-pink-200 bg-pink-50/50",
  "document-ops": "border-blue-200 bg-blue-50/50",
  "integrations": "border-green-200 bg-green-50/50",
  "productivity": "border-orange-200 bg-orange-50/50",
  "ecommerce": "border-indigo-200 bg-indigo-50/50",
};

export function TemplateCard({ template, onUseTemplate, onPreviewTemplate }: TemplateCardProps) {
  const CategoryIcon = categoryIcons[template.category];
  const colorClass = categoryColors[template.category];
  const complexityColorClass = complexityColors[template.complexity];

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${colorClass} group cursor-pointer`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-background/80">
              <CategoryIcon className="size-4" />
            </div>
            {template.featured && (
              <Star className="size-4 text-yellow-500 fill-yellow-500" />
            )}
            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${complexityColorClass}`}>
              {template.complexity}
            </Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Star className="size-3 mr-1" />
            {template.rating}
          </div>
        </div>
        
        <div>
          <CardTitle className="text-sm font-semibold leading-tight mb-1">
            {template.name}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="py-2 space-y-3">
        {/* Template Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Activity className="size-3" />
            <span>{template.nodeCount} nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{template.estimatedSetupTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="size-3" />
            <span>{formatUsageCount(template.usageCount)} uses</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="size-3" />
            <span className="truncate">{template.author}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs px-1.5 py-0.5 bg-background/60"
            >
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-background/60">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-3">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewTemplate(template);
            }}
          >
            <Eye className="size-3 mr-1" />
            Preview
          </Button>
          <Button 
            size="sm" 
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onUseTemplate(template);
            }}
          >
            <Download className="size-3 mr-1" />
            Use Template
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}