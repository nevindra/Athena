"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./button";
import { cn } from "~/lib/utils";

interface CopyButtonProps {
  onCopy: () => Promise<void> | void;
  label: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "default";
}

export function CopyButton({
  onCopy,
  label,
  className = "",
  size = "sm",
  variant = "ghost"
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await onCopy();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      // Error handling is done in the onCopy function
    }
  };

  const sizeClasses = {
    sm: "h-6 w-6 p-0",
    md: "h-8 w-8 p-0",
    lg: "h-10 w-10 p-0"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        sizeClasses[size],
        "transition-colors duration-200",
        isCopied && "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50",
        className
      )}
      aria-label={`Copy ${label}`}
    >
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className={cn(iconSizes[size], "text-green-600 dark:text-green-400")} />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Copy className={iconSizes[size]} />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}