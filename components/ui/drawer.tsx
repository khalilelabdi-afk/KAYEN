"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Drawer — panneau latéral (filtres mobile, panier, menu) ou bas (mobile).
 * Construit sur Radix Dialog pour le focus trap et l'accessibilité.
 */
export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "left" | "right" | "bottom";
  closeLabel?: string;
  width?: string;
}

export const DrawerContent = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Content>, DrawerContentProps>(
  ({ className, children, side = "right", closeLabel = "Fermer", width = "max-w-md", ...props }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 animate-fade-in" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col bg-surface shadow-lg focus:outline-none",
          side === "right" && cn("inset-y-0 end-0 h-dvh w-full animate-slide-in-right rtl:animate-slide-in-left", width),
          side === "left" && cn("inset-y-0 start-0 h-dvh w-full animate-slide-in-left rtl:animate-slide-in-right", width),
          side === "bottom" && "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-xl animate-slide-in-bottom",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper-2 hover:text-foreground"
          aria-label={closeLabel}
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  ),
);
DrawerContent.displayName = "DrawerContent";

export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 border-b border-border px-4 py-3.5 pe-14", className)} {...props} />;
}
export function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto overscroll-contain px-4 py-4", className)} {...props} />;
}
export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t border-border px-4 py-3 safe-bottom", className)} {...props} />;
}
