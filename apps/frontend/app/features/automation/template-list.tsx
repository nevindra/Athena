"use client";

import { Filter, Plus, Search, Star, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TemplateCard } from "./template-card";
import { TemplatePreview } from "./template-preview";
import { sampleTemplates, templateCategories } from "./template-data";
import type { WorkflowTemplate, TemplateCategory } from "./types";

export function TemplateList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null);

  const filteredTemplates = sampleTemplates.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesComplexity = selectedComplexity === "all" || template.complexity === selectedComplexity;

    return matchesSearch && matchesCategory && matchesComplexity;
  });

  const featuredTemplates = filteredTemplates.filter(t => t.featured);
  const popularTemplates = [...filteredTemplates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);
  const recentTemplates = [...filteredTemplates].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);

  const handleUseTemplate = (template: WorkflowTemplate) => {
    // Navigate to workflow builder with template data
    console.log("Using template:", template.name);
    // TODO: Implement template import to workflow builder
  };

  const handlePreviewTemplate = (template: WorkflowTemplate) => {
    setPreviewTemplate(template);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Templates</h1>
          <p className="text-muted-foreground">
            Discover and use pre-built workflows to accelerate your automation projects
          </p>
        </div>
        <Button>
          <Plus className="size-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search templates, tags, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={(value: TemplateCategory | "all") => setSelectedCategory(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {templateCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Template Sections */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="size-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" || selectedComplexity !== "all"
                  ? "No templates match your search criteria"
                  : "No templates found"}
              </div>
              {!searchQuery && selectedCategory === "all" && selectedComplexity === "all" && (
                <Button variant="outline">
                  <Plus className="size-4 mr-2" />
                  Create your first template
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUseTemplate={handleUseTemplate}
                    onPreviewTemplate={handlePreviewTemplate}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              {featuredTemplates.length} featured template{featuredTemplates.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUseTemplate={handleUseTemplate}
                onPreviewTemplate={handlePreviewTemplate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              Top {popularTemplates.length} most used templates
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUseTemplate={handleUseTemplate}
                onPreviewTemplate={handlePreviewTemplate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              {recentTemplates.length} recently updated template{recentTemplates.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUseTemplate={handleUseTemplate}
                onPreviewTemplate={handlePreviewTemplate}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          onUseTemplate={handleUseTemplate}
        />
      )}
    </div>
  );
}