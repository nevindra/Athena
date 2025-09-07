import { SystemPromptCard } from "@/components/system-prompt/system-prompt-card";
import { Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface SystemPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemPromptListProps {
  prompts: SystemPrompt[];
  onEdit: (prompt: SystemPrompt) => void;
  onDelete: (id: string) => void;
  onDuplicate: (prompt: SystemPrompt) => void;
  onCreate: () => void;
}

const categories = ["All", "Structured Output", "Topic Specific", "Custom"];

export function SystemPromptList({
  prompts,
  onEdit,
  onDelete,
  onDuplicate,
  onCreate,
}: SystemPromptListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Prompts</h1>
          <p className="text-muted-foreground">
            Manage system prompts for structured outputs and specific topics
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== "All"
              ? "No prompts match your search criteria"
              : "No system prompts found"}
          </div>
          {!searchQuery && selectedCategory === "All" && (
            <Button onClick={onCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create your first prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt) => (
            <SystemPromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}

      {filteredPrompts.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredPrompts.length} of {prompts.length} prompts
        </div>
      )}
    </div>
  );
}
