"use client";

import { use, useState, useEffect } from "react";
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
import { ImagePlus, Paintbrush, ExternalLink, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { toast } from "sonner";
import Link from "next/link";
import { DesignSettings } from "@/types/event";

export default function DesignSetupPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();

  const { data: event, isLoading } = trpc.events.get.useQuery({ id: eventId });
  
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [customCss, setCustomCss] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initial state population from fetched data
    if (event && !isInitialized) {
      setTimeout(() => {
        setCoverImageUrl(event.coverImageUrl || "");
        const settings = (event.settings as DesignSettings) || {};
        setLogoUrl(settings.logoUrl || "");
        setPrimaryColor(settings.primaryColor || "#2563EB");
        setBackgroundColor(settings.backgroundColor || "#FFFFFF");
        setCustomCss(settings.customCss || "");
        setIsInitialized(true);
      }, 0);
    }
  }, [event, isInitialized]);

  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => {
      toast.success("Design settings saved successfully");
      utils.events.get.invalidate({ id: eventId });
      setIsSaving(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsSaving(false);
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate({
      id: eventId,
      coverImageUrl: coverImageUrl || undefined,
      settings: {
        logoUrl,
        primaryColor,
        backgroundColor,
        customCss,
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Design and Setup</h1>
          <p className="text-muted-foreground">Customize your event landing page and branding.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2 rounded-2xl h-12 font-bold" variant="outline" asChild>
            <Link href={`/e/${(event as any)?.companySlug}/${event?.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" /> Preview
            </Link>
          </Button>
          <Button 
            className="gap-2 rounded-2xl h-12 px-8 font-black shadow-xl shadow-primary/20" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ImagePlus className="h-5 w-5" />
              </div>
              Event Branding
            </CardTitle>
            <CardDescription className="text-md">Upload logos and banner images for your public event page.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-10">
            <ImageUpload
              label="Cover Image"
              description="A beautiful banner image that appears at the top of your landing page."
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              onRemove={() => setCoverImageUrl("")}
              aspectRatio="video"
            />
            
            <Separator className="bg-zinc-100 dark:bg-zinc-800" />
            
            <ImageUpload
              label="Event Logo"
              description="A square logo used in the header and email communications."
              value={logoUrl}
              onChange={setLogoUrl}
              onRemove={() => setLogoUrl("")}
              aspectRatio="square"
            />
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-950">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Paintbrush className="h-5 w-5" />
              </div>
              Theme Colors
            </CardTitle>
            <CardDescription className="text-md">Select colors that match your brand identity.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Primary Color</Label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div 
                    className="h-10 w-10 rounded-xl border border-white/20 shadow-inner" 
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 h-8" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Background Color</Label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div 
                    className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner" 
                    style={{ backgroundColor: backgroundColor }}
                  />
                  <Input 
                    value={backgroundColor} 
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="border-none bg-transparent font-mono text-sm focus-visible:ring-0 h-8" 
                  />
                </div>
              </div>
            </div>
            
            <Separator className="bg-zinc-100 dark:bg-zinc-800" />
            
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom CSS</Label>
              <Textarea 
                placeholder="/* Advanced customization only (e.g., .event-header { ... }) */"
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                className="font-mono text-xs min-h-[160px] rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 p-6 focus-visible:ring-primary"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
