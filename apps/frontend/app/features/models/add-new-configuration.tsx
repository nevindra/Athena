import { Bot, Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export function AddNewConfiguration() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-muted/50 rounded-full p-6 mb-4">
        <Bot className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">
        Welcome to AI Configurations
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Get started by creating your first AI provider configuration. Connect to
        Gemini, Ollama, or any HTTP API.
      </p>
      <Button asChild size="lg" className="gap-2">
        <Link to="/models/add">
          <Plus className="h-4 w-4" />
          Add Your First Configuration
        </Link>
      </Button>
    </div>
  );
}
