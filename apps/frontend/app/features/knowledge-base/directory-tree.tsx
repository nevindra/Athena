"use client";

import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { FileItem } from "./file-manager";

interface DirectoryTreeProps {
  files: FileItem[];
  currentPath: string;
  onPathChange: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isExpanded?: boolean;
}

export function DirectoryTree({
  files,
  currentPath,
  onPathChange,
}: DirectoryTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/"])
  );

  // Build tree structure from files
  const buildTree = (): TreeNode => {
    const root: TreeNode = { name: "Root", path: "/", children: [] };
    const nodeMap = new Map<string, TreeNode>();
    nodeMap.set("/", root);

    // Get all unique folder paths
    const folderPaths = new Set<string>();
    files.forEach((file) => {
      if (file.type === "folder") {
        const fullPath =
          file.path === "/" ? `/${file.name}` : `${file.path}/${file.name}`;
        folderPaths.add(fullPath);

        // Also add parent paths
        const segments = fullPath.split("/").filter(Boolean);
        for (let i = 1; i <= segments.length; i++) {
          const parentPath = "/" + segments.slice(0, i).join("/");
          folderPaths.add(parentPath);
        }
      }
    });

    // Sort paths to ensure parents are processed before children
    const sortedPaths = Array.from(folderPaths).sort();

    sortedPaths.forEach((path) => {
      if (path === "/") return; // Skip root

      const segments = path.split("/").filter(Boolean);
      const name = segments[segments.length - 1];
      const parentPath =
        segments.length === 1 ? "/" : "/" + segments.slice(0, -1).join("/");

      const node: TreeNode = { name, path, children: [] };
      nodeMap.set(path, node);

      const parent = nodeMap.get(parentPath);
      if (parent && !parent.children.find((child) => child.path === path)) {
        parent.children.push(node);
      }
    });

    return root;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTreeNode = (node: TreeNode, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = currentPath === node.path;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.path}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-1 px-2 py-1.5 h-auto text-left font-normal",
            isSelected && "bg-accent text-accent-foreground",
            "hover:bg-accent/50"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => {
            onPathChange(node.path);
            if (hasChildren && !isExpanded) {
              toggleFolder(node.path);
            }
          }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto w-4 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          {node.path === "/" ? (
            <Folder className="size-4 text-muted-foreground shrink-0" />
          ) : isExpanded ? (
            <FolderOpen className="size-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="size-4 text-blue-500 shrink-0" />
          )}

          <span className="truncate text-sm">{node.name}</span>
        </Button>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="p-2 space-y-1">
      <div className="text-xs font-medium text-muted-foreground px-2 py-1">
        FOLDERS
      </div>
      {renderTreeNode(tree)}
    </div>
  );
}
