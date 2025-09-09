import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db";
import { chatMessages, chatSessions } from "../db/schema";
import { StorageFactory } from "../services/storage";

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

      try {
        const storageProvider = StorageFactory.getStorageProvider();
        
        // Use the stored path from MinIO storage
        if (!attachment.path) {
          set.status = 404;
          return {
            success: false,
            error: "File path not found - attachment may be from legacy storage",
          };
        }
        const filePath = attachment.path;
        
        // Check if file exists
        const exists = await storageProvider.exists(filePath);
        if (!exists) {
          set.status = 404;
          return {
            success: false,
            error: "File not found",
          };
        }

        // Download and serve the file
        const fileBuffer = await storageProvider.download(filePath);

        // Set appropriate headers
        set.headers["Content-Type"] = attachment.mimeType;
        set.headers["Content-Length"] = attachment.size.toString();
        set.headers["Content-Disposition"] =
          `inline; filename="${attachment.filename}"`;

        return new Response(fileBuffer, {
          headers: set.headers,
        });
      } catch (fileError) {
        console.error("File download error:", fileError);
        set.status = 404;
        return {
          success: false,
          error: "File not found or download failed",
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
