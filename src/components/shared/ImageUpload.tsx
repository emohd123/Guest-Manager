"use client";

import { useState, useRef } from "react";
import { ImagePlus, Loader2, X, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
  description?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait";
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  description,
  className,
  aspectRatio = "video",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from("events")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("events")
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please ensure the 'events' bucket exists in your Supabase storage.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square w-full min-h-[220px]",
    portrait: "aspect-[3/4]",
  };

  return (
    <div className={cn("space-y-4 w-full", className)}>
      {label && <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{label}</label>}
      
      <div className="relative group w-full">
        {value ? (
          <div className={cn(
            "relative w-full overflow-hidden rounded-[2rem] border-2 border-zinc-100 dark:border-zinc-800 transition-all duration-500",
            aspectClasses[aspectRatio]
          )}>
            <img 
              src={value} 
              alt="Uploaded brand asset" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-xl font-bold bg-white/90 hover:bg-white text-zinc-950"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group",
              aspectClasses[aspectRatio]
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="text-sm font-bold text-zinc-500 animate-pulse">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6">
                <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-black text-zinc-950 dark:text-white mb-1">
                  Click to upload {label?.toLowerCase() || "image"}
                </p>
                {description && (
                  <p className="text-xs text-zinc-500 font-medium max-w-[200px] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUpload}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
