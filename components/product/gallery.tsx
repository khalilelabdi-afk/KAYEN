"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface GalleryImage { id: string; url: string; alt: string; width: number; height: number; variantId: string | null }

export function ProductGallery({ images, name, videoUrl, activeVariantId }: { images: GalleryImage[]; name: string; videoUrl: string | null; activeVariantId: string | null }) {
  const t = useT();
  const [index, setIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
  const [showVideo, setShowVideo] = React.useState(false);

  const [lastVariantId, setLastVariantId] = React.useState(activeVariantId);
  if (activeVariantId !== lastVariantId) {
    setLastVariantId(activeVariantId);
    const i = activeVariantId ? images.findIndex((img) => img.variantId === activeVariantId) : -1;
    if (i >= 0) setIndex(i);
  }

  const current = images[index] ?? images[0];
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  if (!current) {
    return <div className="aspect-square rounded-lg border border-border bg-paper-2" aria-hidden />;
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
      <div className="relative min-w-0 flex-1">
        <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-paper-2">
          {showVideo && videoUrl ? (
            <iframe src={videoUrl} title={t("catalog.pdp.gallery.video")} className="size-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <button type="button" onClick={() => setZoom(true)} className="relative block size-full cursor-zoom-in" aria-label={t("catalog.pdp.gallery.zoom")}>
              <Image key={current.id} src={current.url} alt={current.alt || name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} />
              <span className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-md bg-surface/90 text-foreground opacity-0 shadow-xs transition-opacity group-hover:opacity-100"><Maximize2 className="size-4" /></span>
            </button>
          )}
          {images.length > 1 && !showVideo && (
            <>
              <button type="button" onClick={prev} className="absolute start-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-xs hover:bg-surface" aria-label={t("catalog.pdp.gallery.previous")}><ChevronLeft className="size-4 rtl:rotate-180" /></button>
              <button type="button" onClick={next} className="absolute end-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 shadow-xs hover:bg-surface" aria-label={t("catalog.pdp.gallery.next")}><ChevronRight className="size-4 rtl:rotate-180" /></button>
            </>
          )}
        </div>
      </div>
      {(images.length > 1 || videoUrl) && (
        <ul className="flex gap-2 overflow-x-auto scrollbar-none md:w-20 md:flex-col md:overflow-visible" role="tablist">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                role="tab"
                aria-selected={i === index && !showVideo}
                aria-label={t("catalog.pdp.gallery.thumbnail", { index: i + 1 })}
                onClick={() => { setIndex(i); setShowVideo(false); }}
                className={cn("relative block size-16 overflow-hidden rounded-md border bg-paper-2 transition-colors md:size-20", i === index && !showVideo ? "border-ink" : "border-border hover:border-border-strong")}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
          {videoUrl && (
            <li className="shrink-0">
              <button type="button" onClick={() => setShowVideo(true)} className={cn("flex size-16 items-center justify-center rounded-md border bg-paper-2 md:size-20", showVideo ? "border-ink" : "border-border")} aria-label={t("catalog.pdp.gallery.video")}>
                <Play className="size-5" />
              </button>
            </li>
          )}
        </ul>
      )}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent size="xl" closeLabel={t("common.actions.close")} className="bg-paper">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div className="relative aspect-square w-full">
            <Image src={current.url} alt={current.alt || name} fill sizes="90vw" className="object-contain" quality={90} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
