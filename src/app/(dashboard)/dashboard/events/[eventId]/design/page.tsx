"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImagePlus, Paintbrush, Globe, ExternalLink } from "lucide-react";

export default function DesignSetupPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Design and Setup</h1>
          <p className="text-muted-foreground">Customize your event landing page and branding.</p>
        </div>
        <Button className="gap-2" variant="outline">
          <ExternalLink className="h-4 w-4" /> Preview Live Page
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              Event Branding
            </CardTitle>
            <CardDescription>Upload logos and banner images for your public event page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                <ImagePlus className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Click to upload banner</p>
                <p className="text-xs text-muted-foreground mt-1">Recommended: 1200x600px (16:9 ratio)</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Event Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">Upload a square logo</p>
                  <p className="text-xs text-muted-foreground">Will be used in header and emails.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paintbrush className="h-5 w-5" />
              Theme Colors
            </CardTitle>
            <CardDescription>Select colors that match your brand identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded border bg-blue-600"></div>
                  <Input defaultValue="#2563EB" className="font-mono text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded border bg-white dark:bg-zinc-950"></div>
                  <Input defaultValue="#FFFFFF" className="font-mono text-sm" />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Custom CSS</Label>
              <Textarea 
                placeholder="/* Advanced customization only */"
                className="font-mono text-xs min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Event Website Customization
            </CardTitle>
            <CardDescription>Structure the content on your customized URL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Custom URL Slug</Label>
              <div className="flex items-center">
                <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  app.guestmanager.com/e/
                </span>
                <Input 
                  className="rounded-l-none" 
                  defaultValue={`event-${eventId.slice(0,6)}`} 
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button>Save Design Settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
