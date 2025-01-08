"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Copy, Code } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  username: string;
  eventUrl: string;
}

export function ShareDialog({ username, eventUrl }: ShareDialogProps) {
  const fullUrl = `${process.env.NEXT_PUBLIC_URL}/${username}/${eventUrl}`;
  const embedCode = `<iframe
  src="${fullUrl}"
  width="100%"
  height="800"
  frameBorder="0"
  style="border: none;"
></iframe>`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon">
          <Share2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your booking page</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="embed">Embed</TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="mt-4">
            <div className="flex space-x-2">
              <input
                className="flex-1 px-3 py-2 text-sm border rounded-md"
                value={fullUrl}
                readOnly
                aria-label="Booking page URL"
                placeholder="Booking page URL"
              />
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(fullUrl);
                  toast.success("Link copied to clipboard");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="embed" className="mt-4">
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <pre className="text-sm overflow-x-auto">{embedCode}</pre>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(embedCode);
                  toast.success("Embed code copied to clipboard");
                }}
              >
                <Code className="mr-2 size-4" />
                Copy Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
