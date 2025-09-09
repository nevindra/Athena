import { and, desc, eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import type {
  CreateKnowledgeBaseRequest,
  KnowledgeBaseResponse,
  UpdateKnowledgeBaseRequest,
} from "@athena/shared";
import { db } from "../../db";
import { files, knowledgeBases, users } from "../../db/schema";
import type { KnowledgeBase, NewKnowledgeBase } from "../../db/schema";

export class KnowledgeBaseService {
  async createKnowledgeBase(
    userId: string,
    request: CreateKnowledgeBaseRequest
  ): Promise<KnowledgeBaseResponse> {
    // Generate path based on parent
    let path = `/${request.name.toLowerCase().replace(/\s+/g, "-")}`;
    
    if (request.parentId) {
      const parent = await this.getKnowledgeBaseById(userId, request.parentId);
      if (!parent) {
        throw new Error("Parent knowledge base not found");
      }
      path = `${parent.path}${path}`;
    }

    const newKnowledgeBase: NewKnowledgeBase = {
      id: ulid(),
      userId,
      name: request.name,
      description: request.description,
      parentId: request.parentId,
      path,
      settings: {
        isPublic: request.settings?.isPublic ?? false,
        allowedFileTypes: request.settings?.allowedFileTypes ?? ["*"],
        maxFileSize: request.settings?.maxFileSize ?? 52428800, // 50MB
      },
    };

    const [createdKB] = await db
      .insert(knowledgeBases)
      .values(newKnowledgeBase)
      .returning();

    return await this.enrichKnowledgeBaseWithStats(createdKB);
  }

  async getKnowledgeBases(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      parentId?: string;
      includeChildren?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 20, parentId, includeChildren = false } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(knowledgeBases.userId, userId)];
    
    if (parentId !== undefined) {
      conditions.push(eq(knowledgeBases.parentId, parentId));
    }

    // Get knowledge bases
    const kbResults = await db
      .select({
        id: knowledgeBases.id,
        userId: knowledgeBases.userId,
        name: knowledgeBases.name,
        description: knowledgeBases.description,
        parentId: knowledgeBases.parentId,
        path: knowledgeBases.path,
        settings: knowledgeBases.settings,
        createdAt: knowledgeBases.createdAt,
        updatedAt: knowledgeBases.updatedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(knowledgeBases)
      .innerJoin(users, eq(knowledgeBases.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(knowledgeBases.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeBases)
      .where(and(...conditions));

    // Enrich with stats and relationships
    const enrichedKBs = await Promise.all(
      kbResults.map(async (kb) => {
        const enriched = await this.enrichKnowledgeBaseWithStats(kb as any);
        
        if (includeChildren) {
          enriched.children = await this.getDirectChildren(kb.id);
        }

        return enriched;
      })
    );

    return {
      knowledgeBases: enrichedKBs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getKnowledgeBaseById(
    userId: string,
    knowledgeBaseId: string,
    includeChildren: boolean = false
  ): Promise<KnowledgeBaseResponse | null> {
    const [kb] = await db
      .select()
      .from(knowledgeBases)
      .where(
        and(
          eq(knowledgeBases.id, knowledgeBaseId),
          eq(knowledgeBases.userId, userId)
        )
      )
      .limit(1);

    if (!kb) {
      return null;
    }

    const enriched = await this.enrichKnowledgeBaseWithStats(kb);

    if (includeChildren) {
      enriched.children = await this.getDirectChildren(knowledgeBaseId);
    }

    return enriched;
  }

  async updateKnowledgeBase(
    userId: string,
    knowledgeBaseId: string,
    updates: UpdateKnowledgeBaseRequest
  ): Promise<KnowledgeBaseResponse | null> {
    const updateData: Partial<KnowledgeBase> = {
      updatedAt: new Date(),
    };

    if (updates.name) {
      updateData.name = updates.name;
      
      // Update path if name changed
      const [currentKB] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, knowledgeBaseId))
        .limit(1);

      if (currentKB) {
        const pathParts = currentKB.path.split('/');
        pathParts[pathParts.length - 1] = updates.name.toLowerCase().replace(/\s+/g, "-");
        updateData.path = pathParts.join('/');
      }
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.parentId !== undefined) {
      updateData.parentId = updates.parentId;
      
      // Update path based on new parent
      if (updates.parentId) {
        const parent = await this.getKnowledgeBaseById(userId, updates.parentId);
        if (!parent) {
          throw new Error("Parent knowledge base not found");
        }
        
        const [currentKB] = await db
          .select()
          .from(knowledgeBases)
          .where(eq(knowledgeBases.id, knowledgeBaseId))
          .limit(1);

        if (currentKB) {
          const name = updates.name || currentKB.name;
          const pathName = name.toLowerCase().replace(/\s+/g, "-");
          updateData.path = `${parent.path}/${pathName}`;
        }
      }
    }

    if (updates.settings) {
      const [currentKB] = await db
        .select({ settings: knowledgeBases.settings })
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, knowledgeBaseId))
        .limit(1);

      const currentSettings = (currentKB?.settings as any) || {};
      updateData.settings = {
        ...currentSettings,
        ...updates.settings,
      };
    }

    const [updatedKB] = await db
      .update(knowledgeBases)
      .set(updateData)
      .where(
        and(
          eq(knowledgeBases.id, knowledgeBaseId),
          eq(knowledgeBases.userId, userId)
        )
      )
      .returning();

    if (!updatedKB) {
      return null;
    }

    return await this.enrichKnowledgeBaseWithStats(updatedKB);
  }

  async deleteKnowledgeBase(
    userId: string,
    knowledgeBaseId: string,
    options: { deleteFiles?: boolean } = {}
  ): Promise<boolean> {
    const { deleteFiles = false } = options;

    // Check if knowledge base exists and belongs to user
    const [kb] = await db
      .select()
      .from(knowledgeBases)
      .where(
        and(
          eq(knowledgeBases.id, knowledgeBaseId),
          eq(knowledgeBases.userId, userId)
        )
      )
      .limit(1);

    if (!kb) {
      return false;
    }

    // Check if it has children
    const children = await this.getDirectChildren(knowledgeBaseId);
    if (children.length > 0) {
      throw new Error("Cannot delete knowledge base with child knowledge bases");
    }

    if (deleteFiles) {
      // Delete all files in this knowledge base (soft delete)
      await db
        .update(files)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where(eq(files.knowledgeBaseId, knowledgeBaseId));
    } else {
      // Move files to user's root (no knowledge base)
      await db
        .update(files)
        .set({
          knowledgeBaseId: null,
          updatedAt: new Date(),
        })
        .where(eq(files.knowledgeBaseId, knowledgeBaseId));
    }

    // Delete the knowledge base
    await db
      .delete(knowledgeBases)
      .where(eq(knowledgeBases.id, knowledgeBaseId));

    return true;
  }

  async getKnowledgeBaseHierarchy(userId: string): Promise<KnowledgeBaseResponse[]> {
    // Get all knowledge bases for user
    const allKBs = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.userId, userId))
      .orderBy(knowledgeBases.path);

    const enrichedKBs = await Promise.all(
      allKBs.map(kb => this.enrichKnowledgeBaseWithStats(kb))
    );

    // Build hierarchy
    const kbMap = new Map<string, KnowledgeBaseResponse>();
    const rootKBs: KnowledgeBaseResponse[] = [];

    // Create map and identify root knowledge bases
    for (const kb of enrichedKBs) {
      kbMap.set(kb.id, { ...kb, children: [] });
      if (!kb.parentId) {
        rootKBs.push(kbMap.get(kb.id)!);
      }
    }

    // Build parent-child relationships
    for (const kb of enrichedKBs) {
      if (kb.parentId) {
        const parent = kbMap.get(kb.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(kbMap.get(kb.id)!);
        }
      }
    }

    return rootKBs;
  }

  private async getDirectChildren(knowledgeBaseId: string): Promise<KnowledgeBaseResponse[]> {
    const children = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.parentId, knowledgeBaseId))
      .orderBy(knowledgeBases.name);

    return await Promise.all(
      children.map(child => this.enrichKnowledgeBaseWithStats(child))
    );
  }

  private async enrichKnowledgeBaseWithStats(
    kb: KnowledgeBase
  ): Promise<KnowledgeBaseResponse> {
    // Get file statistics
    const [stats] = await db
      .select({
        fileCount: sql<number>`count(*)`,
        totalSize: sql<number>`coalesce(sum(${files.size}::bigint), 0)`,
        lastActivity: sql<Date>`max(${files.updatedAt})`,
      })
      .from(files)
      .where(
        and(
          eq(files.knowledgeBaseId, kb.id),
          eq(files.isDeleted, false)
        )
      );

    // Get parent information if exists
    let parent: KnowledgeBase | undefined;
    if (kb.parentId) {
      const [parentResult] = await db
        .select()
        .from(knowledgeBases)
        .where(eq(knowledgeBases.id, kb.parentId))
        .limit(1);
      parent = parentResult;
    }

    return {
      id: kb.id,
      userId: kb.userId,
      name: kb.name,
      description: kb.description,
      parentId: kb.parentId,
      path: kb.path,
      settings: kb.settings as any,
      createdAt: kb.createdAt.toISOString(),
      updatedAt: kb.updatedAt.toISOString(),
      stats: {
        fileCount: stats?.fileCount || 0,
        totalSize: stats?.totalSize || 0,
        lastActivity: stats?.lastActivity?.toISOString() || kb.createdAt.toISOString(),
      },
      parent,
    };
  }
}