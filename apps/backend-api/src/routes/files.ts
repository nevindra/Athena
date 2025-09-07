import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { chatMessages, chatSessions } from "../db/schema";

export const filesRoutes = new Elysia({ prefix: "/files" }).get(
  "/:sessionId/:attachmentId",
  async ({ params, set, query }) => {
    try {
      const { sessionId, attachmentId } = params;
      const userId = query.userId;

      if (!userId) {
        set.status = 401;
        return {
          success: false,
          error: "User ID required",
        };
      }

      // Verify user owns the session
      const [session] = await db
        .select()
        .from(chatSessions)
        .where(
          and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
        )
        .limit(1);

      if (!session) {
        set.status = 404;
        return {
          success: false,
          error: "Session not found or unauthorized",
        };
      }

      // Find the message with the attachment
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId));

      let attachment: any = null;
      let _messageId: string | null = null;

      for (const message of messages) {
        if (message.attachments) {
          const foundAttachment = message.attachments.find(
            (att: any) => att.id === attachmentId
          );
          if (foundAttachment) {
            attachment = foundAttachment;
            _messageId = message.id;
            break;
          }
        }
      }

      if (!attachment) {
        set.status = 404;
        return {
          success: false,
          error: "Attachment not found",
        };
      }

      // Construct file path
      const filename = `${attachmentId}_${attachment.filename}`;
      const filePath = join(
        process.cwd(),
        "uploads",
        "messages",
        sessionId,
        filename
      );

      try {
        // Check if file exists and get stats
        const fileStats = await stat(filePath);
        if (!fileStats.isFile()) {
          set.status = 404;
          return {
            success: false,
            error: "File not found",
          };
        }

        // Read and serve the file
        const fileBuffer = await readFile(filePath);

        // Set appropriate headers
        set.headers["Content-Type"] = attachment.mimeType;
        set.headers["Content-Length"] = attachment.size.toString();
        set.headers["Content-Disposition"] =
          `inline; filename="${attachment.filename}"`;

        return new Response(fileBuffer, {
          headers: set.headers,
        });
      } catch (fileError) {
        console.error("File read error:", fileError);
        set.status = 404;
        return {
          success: false,
          error: "File not found on disk",
        };
      }
    } catch (error) {
      console.error("File serve error:", error);
      set.status = 500;
      return {
        success: false,
        error: "Failed to serve file",
      };
    }
  },
  {
    params: t.Object({
      sessionId: t.String(),
      attachmentId: t.String(),
    }),
    query: t.Object({
      userId: t.String(),
    }),
  }
);
