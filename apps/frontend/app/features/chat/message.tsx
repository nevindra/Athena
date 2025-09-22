import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ThinkingSection } from "./thinking-section";

interface MessageProps {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: { type: "image"; url: string; name?: string }[];
  onRefresh?: () => void;
}

function isImageFile(content: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
  const lines = content.split("\n");

  // Check if content contains only a file path that looks like an image
  if (lines.length === 1 && imageExtensions.test(lines[0].trim())) {
    return true;
  }

  // Check if content is a data URL for an image
  if (content.startsWith("data:image/")) {
    return true;
  }

  return false;
}

function parseMessageContent(content: string) {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);

  if (thinkMatch) {
    const thinkingContent = thinkMatch[1].trim();
    let actualResponse = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();

    // Check if actualResponse is JSON
    const { isJson, jsonData } = tryParseJson(actualResponse);
    if (isJson) {
      return { thinkingContent, actualResponse: null, jsonData };
    }

    actualResponse = preprocessMarkdown(actualResponse);
    return { thinkingContent, actualResponse, jsonData: null };
  }

  // Check if content is JSON
  const { isJson, jsonData } = tryParseJson(content);
  if (isJson) {
    return { thinkingContent: null, actualResponse: null, jsonData };
  }

  const processedContent = preprocessMarkdown(content);
  return {
    thinkingContent: null,
    actualResponse: processedContent,
    jsonData: null,
  };
}

function tryParseJson(text: string): { isJson: boolean; jsonData: any } {
  try {
    // Remove leading/trailing whitespace
    const trimmed = text.trim();

    // Check if it looks like JSON (starts with { or [)
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      const parsed = JSON.parse(trimmed);
      return { isJson: true, jsonData: parsed };
    }

    return { isJson: false, jsonData: null };
  } catch {
    return { isJson: false, jsonData: null };
  }
}

function preprocessMarkdown(text: string): string {
  // Only convert LaTeX notation to dollar signs if not already in dollar format
  // This prevents double processing when content has mixed notation
  let processed = text
    // Convert display math: \[ ... \] to $$ ... $$ only if not already surrounded by $$
    .replace(/(?<!\$\$)\\\[\s*([\s\S]*?)\s*\\\](?!\$\$)/g, (_, content) => {
      return `\n$$${content.trim()}$$\n`;
    })
    // Convert inline math: \( ... \) to $ ... $ only if not already surrounded by $
    .replace(/(?<!\$)\\\(\s*(.*?)\s*\\\)(?!\$)/g, (_, content) => {
      return `$${content.trim()}$`;
    });

  // Handle nested lists properly
  const lines = processed.split("\n");
  const processedLines = [];
  let inNumberedList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this is a numbered list item
    if (/^\d+\.\s+/.test(trimmedLine)) {
      inNumberedList = true;
      processedLines.push(trimmedLine);
    }
    // Check if this is a bullet point that should be nested under a numbered item
    else if (inNumberedList && /^[-•*]\s+/.test(trimmedLine)) {
      // Add proper indentation for nested list items
      processedLines.push("   " + trimmedLine.replace(/^[-•*]\s+/, "- "));
    }
    // Regular content
    else {
      if (trimmedLine === "") {
        // Empty line might end the numbered list context
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
        if (!/^\d+\.\s+/.test(nextLine) && !/^[-•*]\s+/.test(nextLine)) {
          inNumberedList = false;
        }
      } else if (
        !/^\d+\.\s+/.test(trimmedLine) &&
        !/^[-•*]\s+/.test(trimmedLine)
      ) {
        inNumberedList = false;
      }
      processedLines.push(line);
    }
  }

  return processedLines.join("\n").trim();
}

function JsonDisplay({ data }: { data: any }) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="bg-muted/30 rounded-lg p-3 my-2 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">
          Structured Output
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(jsonString)}
          className="text-xs px-2 py-1 bg-background hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          Copy JSON
        </button>
      </div>
      <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}

export function Message({
  content,
  role,
  timestamp,
  attachments,
  onRefresh,
}: MessageProps) {
  const { thinkingContent, actualResponse, jsonData } =
    parseMessageContent(content);
  const isImage = isImageFile(content);

  const handleCopy = async () => {
    try {
      const textToCopy = actualResponse || content;
      await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Assistant messages as document cards
  if (role === "assistant") {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-card rounded-lg border border-border shadow-sm">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-medium">
                  ✨
                </div>
                <span className="text-sm font-medium text-foreground">Results</span>
              </div>
              
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 w-7 p-0 hover:bg-muted"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy response</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {onRefresh && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onRefresh}
                          className="h-7 w-7 p-0 hover:bg-muted"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Regenerate response</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {thinkingContent && (
              <ThinkingSection thinkingContent={thinkingContent} />
            )}

            {/* Render attachments */}
            {attachments && attachments.length > 0 && (
              <div className={`space-y-2 ${thinkingContent ? "mt-3" : ""}`}>
                {attachments.map((attachment) => (
                  <div
                    key={`${attachment.url}-${attachment.name}`}
                    className="relative"
                  >
                    {attachment.type === "image" && (
                      <img
                        src={attachment.url}
                        alt={attachment.name || ""}
                        className="max-w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Render image if content is detected as image */}
            {isImage && !attachments && (
              <div className={`${thinkingContent ? "mt-3" : ""}`}>
                <img
                  src={content.trim()}
                  alt=""
                  className="max-w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Render JSON data if available */}
            {jsonData && (
              <div
                className={`${thinkingContent || (attachments && attachments.length > 0) ? "mt-3" : ""}`}
              >
                <JsonDisplay data={jsonData} />
              </div>
            )}

            {actualResponse && !isImage && (
              <div
                className={`text-sm leading-relaxed text-foreground ${thinkingContent || (attachments && attachments.length > 0) || jsonData ? "mt-3" : ""}`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[
                    [rehypeKatex, { strict: false, throwOnError: false }],
                  ]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono text-foreground">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs font-mono my-3 border border-border">
                        {children}
                      </pre>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside my-3 space-y-1 ml-4">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside my-3 space-y-2 ml-6">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-2 leading-relaxed">{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-border pl-4 my-3 text-muted-foreground italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {actualResponse}
                </ReactMarkdown>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User messages remain as chat bubbles
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] p-4 rounded-2xl bg-primary text-primary-foreground">
        {thinkingContent && role === "assistant" && (
          <ThinkingSection thinkingContent={thinkingContent} />
        )}

        {/* Render attachments */}
        {attachments && attachments.length > 0 && (
          <div className={`space-y-2 ${thinkingContent ? "mt-3" : ""}`}>
            {attachments.map((attachment) => (
              <div
                key={`${attachment.url}-${attachment.name}`}
                className="relative"
              >
                {attachment.type === "image" && (
                  <img
                    src={attachment.url}
                    alt={attachment.name || ""}
                    className="max-w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Render image if content is detected as image */}
        {isImage && !attachments && (
          <div className={`${thinkingContent ? "mt-3" : ""}`}>
            <img
              src={content.trim()}
              alt=""
              className="max-w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        )}

        {/* Render JSON data if available */}
        {jsonData && (
          <div
            className={`${thinkingContent || (attachments && attachments.length > 0) ? "mt-3" : ""}`}
          >
            <JsonDisplay data={jsonData} />
          </div>
        )}

        {actualResponse && !isImage && (
          <div
            className={`text-sm leading-relaxed ${thinkingContent || (attachments && attachments.length > 0) || jsonData ? "mt-3" : ""}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[
                [rehypeKatex, { strict: false, throwOnError: false }],
              ]}
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-background/30 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-background/30 p-2 rounded-md overflow-x-auto text-xs font-mono my-2">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside my-2 space-y-1 ml-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside my-2 space-y-2 ml-6">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="mb-2 leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary-foreground/30 pl-3 my-2 opacity-80">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {actualResponse}
            </ReactMarkdown>
          </div>
        )}

        <p className="text-xs opacity-70 mt-2">
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
