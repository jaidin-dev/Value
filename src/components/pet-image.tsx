import { useState } from "react";
import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

export function PetImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid place-items-center text-muted-foreground/50", className)}>
        <PawPrint className="size-1/3" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]", className)}
    />
  );
}
