"use client";

import type { ApiRegistration } from "@athena/shared";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface ApiDocumentationDialogProps {
  api: ApiRegistration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiDocumentationDialog({
  api,
  open,
  onOpenChange,
}: ApiDocumentationDialogProps) {
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  if (!api) return null;

  const endpointUrl = `${api.baseUrl}/chat`;
  const curlExample = `curl -X POST "${endpointUrl}" \\
  -H "Authorization: Bearer ${api.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello, how can you help me?"
      }
    ]
  }'`;

  const jsExample = `const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${api.apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: [
      {
        role: "user",
        content: "Hello, how can you help me?"
      }
    ]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`;

  const pythonExample = `import requests

response = requests.post(
    "${endpointUrl}",
    headers={
        "Authorization": "Bearer ${api.apiKey}",
        "Content-Type": "application/json"
    },
    json={
        "messages": [
            {
                "role": "user",
                "content": "Hello, how can you help me?"
            }
        ]
    }
)

data = response.json()
print(data["choices"][0]["message"]["content"])`;

  const responseExample = `{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1699999999,
  "model": "athena-custom",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm here to help you..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 20,
    "total_tokens": 32
  }
}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] !max-w-none sm:!max-w-none max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>API Documentation: {api.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Endpoint Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">URL:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {endpointUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(endpointUrl, "Endpoint URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">API Key:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {api.apiKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(api.apiKey, "API Key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <span className="text-sm font-medium">Method:</span>
                  <code className="bg-muted px-2 py-1 rounded text-sm ml-2">POST</code>
                </div>
              </div>
            </div>

            {api.description && (
              <div>
                <h4 className="font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{api.description}</p>
              </div>
            )}
          </div>

          {/* Code Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Code Examples</h3>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
              </TabsList>

              <TabsContent value="curl" className="mt-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{curlExample}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(curlExample, "cURL example")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="javascript" className="mt-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{jsExample}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(jsExample, "JavaScript example")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{pythonExample}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(pythonExample, "Python example")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="response" className="mt-4">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{responseExample}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(responseExample, "Response example")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Request Format */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Request Format</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Headers:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>Authorization: Bearer {"{your-api-key}"}</code></li>
                <li><code>Content-Type: application/json</code></li>
              </ul>

              <p className="mt-4"><strong>Body Parameters:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>messages</code> (required): Array of message objects with <code>role</code> and <code>content</code></li>
                <li><code>max_tokens</code> (optional): Maximum number of tokens to generate</li>
                <li><code>temperature</code> (optional): Sampling temperature (0-1)</li>
              </ul>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-muted p-4 rounded">
            <h4 className="font-medium mb-2">Important Notes</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>This endpoint uses OpenAI-compatible format</li>
              <li>System prompt is automatically applied to all requests</li>
              <li>Keep your API key secure and never expose it in client-side code</li>
              <li>Rate limiting may apply based on your configuration</li>
            </ul>
          </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
