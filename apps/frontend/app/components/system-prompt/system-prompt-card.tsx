import { FileText, Edit, Trash2, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface SystemPrompt {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemPromptCardProps {
  prompt: SystemPrompt;
  onEdit: (prompt: SystemPrompt) => void;
  onDelete: (id: string) => void;
  onDuplicate: (prompt: SystemPrompt) => void;
}

const categoryColors = {
  "Structured Output": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "Topic Specific": "bg-purple-100 text-purple-800 hover:bg-purple-200",
  "Custom": "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

export function SystemPromptCard({ prompt, onEdit, onDelete, onDuplicate }: SystemPromptCardProps) {
  const categoryColor = categoryColors[prompt.category as keyof typeof categoryColors] || categoryColors.Custom;

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{prompt.title}</CardTitle>
          </div>
          <Badge variant="secondary" className={categoryColor}>
            {prompt.category}
          </Badge>
        </div>
        {prompt.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {prompt.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-xs text-muted-foreground font-mono line-clamp-3">
              {prompt.content}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated {new Date(prompt.updatedAt).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(prompt)}
              className="h-8 px-2"
            >
              <Edit className="h-3 w-3" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(prompt)}
              className="h-8 px-2"
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Duplicate</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(prompt.id)}
              className="h-8 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}