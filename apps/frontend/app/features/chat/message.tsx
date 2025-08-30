import { ThinkingSection } from "./thinking-section";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MessageProps {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: { type: "image"; url: string; name?: string }[];
}

function isImageFile(content: string): boolean {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
  const lines = content.split('\n');
  
  // Check if content contains only a file path that looks like an image
  if (lines.length === 1 && imageExtensions.test(lines[0].trim())) {
    return true;
  }
  
  // Check if content is a data URL for an image
  if (content.startsWith('data:image/')) {
    return true;
  }
  
  return false;
}

function parseMessageContent(content: string) {
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  
  if (thinkMatch) {
    const thinkingContent = thinkMatch[1].trim();
    let actualResponse = content.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    actualResponse = preprocessMarkdown(actualResponse);
    return { thinkingContent, actualResponse };
  }
  
  const processedContent = preprocessMarkdown(content);
  return { thinkingContent: null, actualResponse: processedContent };
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
  const lines = processed.split('\n');
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
      processedLines.push('   ' + trimmedLine.replace(/^[-•*]\s+/, '- '));
    }
    // Regular content
    else {
      if (trimmedLine === '') {
        // Empty line might end the numbered list context
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (!/^\d+\.\s+/.test(nextLine) && !/^[-•*]\s+/.test(nextLine)) {
          inNumberedList = false;
        }
      } else if (!/^\d+\.\s+/.test(trimmedLine) && !/^[-•*]\s+/.test(trimmedLine)) {
        inNumberedList = false;
      }
      processedLines.push(line);
    }
  }
  
  return processedLines.join('\n').trim();
}

export function Message({ content, role, timestamp, attachments }: MessageProps) {
  const { thinkingContent, actualResponse } = parseMessageContent(content);
  const isImage = isImageFile(content);

  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-2xl ${
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {thinkingContent && role === "assistant" && (
          <ThinkingSection thinkingContent={thinkingContent} />
        )}
        
        {/* Render attachments */}
        {attachments && attachments.length > 0 && (
          <div className={`space-y-2 ${thinkingContent ? "mt-3" : ""}`}>
            {attachments.map((attachment) => (
              <div key={`${attachment.url}-${attachment.name}`} className="relative">
                {attachment.type === "image" && (
                  <img
                    src={attachment.url}
                    alt={attachment.name || ""}
                    className="max-w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
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
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {actualResponse && !isImage && (
          <div className={`text-sm leading-relaxed ${thinkingContent || (attachments && attachments.length > 0) ? "mt-3" : ""}`}>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted/50 p-2 rounded-md overflow-x-auto text-xs font-mono my-2">
                    {children}
                  </pre>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1 ml-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside my-2 space-y-2 ml-6">{children}</ol>,
                li: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-muted-foreground/20 pl-3 my-2 text-muted-foreground">
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