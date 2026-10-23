"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** next/image + yüklenemeyen görsel durumu (kırık görsel ikonu yerine marka uyumlu boş durum). */
export function SafeImage({ className, alt, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span role="img" aria-label={alt || "Görsel yüklenemedi"} className={cn("flex h-full w-full items-center justify-center bg-sand text-muted", props.fill && "absolute inset-0", className)}>
        <ImageOff aria-hidden="true" className="h-7 w-7 opacity-60" />
      </span>
    );
  }
  return <Image {...props} alt={alt} className={className} onError={() => setFailed(true)} />;
}
