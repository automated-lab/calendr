"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <Button
      variant="ghost"
      className="text-sm text-primary dark:text-muted-foreground"
      onClick={() => {
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }}
    >
      <Copy className="size-4 mr-2 text-primary dark:text-muted-foreground" />
      Copy Link
    </Button>
  );
}
