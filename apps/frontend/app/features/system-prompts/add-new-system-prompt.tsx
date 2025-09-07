import { FileText, Lightbulb, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

interface AddNewSystemPromptProps {
  onCreate: () => void;
}

export function AddNewSystemPrompt({ onCreate }: AddNewSystemPromptProps) {
  const examples = [
    {
      title: "Structured JSON Generator",
      description:
        "Generate structured JSON responses with specific schemas and validation",
      category: "Structured Output",
    },
    {
      title: "Medical Data Analysis",
      description:
        "Analyze medical data and provide insights in healthcare context",
      category: "Topic Specific",
    },
    {
      title: "API Documentation Generator",
      description:
        "Generate consistent API documentation with structured format",
      category: "Structured Output",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">System Prompts</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Create system prompts to guide AI responses for structured outputs
            and specific topics
          </p>
        </div>
        <Button onClick={onCreate} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Your First System Prompt
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">
            Get Started with These Ideas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {examples.map((example, index) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={onCreate}
            >
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-sm">{example.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {example.description}
                </p>
                <div className="text-xs text-primary font-medium">
                  {example.category}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">What are System Prompts?</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            System prompts help you create consistent, structured responses from
            AI models. They're especially useful for:
          </p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>
              <strong>Structured Output:</strong> Generate responses in specific
              formats in JSON structured output capabilities
            </li>
            <li>
              <strong>Topic Specific:</strong> Focus AI responses on particular
              domains like healthcare, finance, or technical documentation
            </li>
            <li>
              <strong>Consistency:</strong> Ensure similar response patterns and
              quality across conversations
            </li>
            <li>
              <strong>Custom Logic:</strong> Implement specific business rules
              and validation requirements
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
