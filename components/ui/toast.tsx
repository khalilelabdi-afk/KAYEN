"use client";

import * as React from "react";
import { Toast as Primitive } from "radix-ui";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toasts discrets : file d'attente limitée (3), auto-dismiss, aria-live.
 * API : const toast = useToast(); toast.success("Produit ajouté au panier")
 */
export type ToastTone = "success" | "error" | "info";
export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; href?: string; onClick?: () => void };
  duration?: number;
}

type ToastInput = Omit<ToastItem, "id" | "tone"> & { tone?: ToastTone };

interface ToastApi {
  show: (input: ToastInput) => void;
  success: (title: string, extra?: Partial<ToastInput>) => void;
  error: (title: string, extra?: Partial<ToastInput>) => void;
  info: (title: string, extra?: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
  /** Affiche le message de succès ou l'erreur d'un ActionResult. */
  fromResult: (result: { ok: true; message?: string } | { ok: false; error: string }, fallback?: string) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);
let counter = 0;

export function ToastProvider({ children, closeLabel = "Fermer" }: { children: React.ReactNode; closeLabel?: string }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const show = React.useCallback((input: ToastInput) => {
    counter += 1;
    const item: ToastItem = { id: counter, tone: "info", duration: 3500, ...input };
    setItems((prev) => [...prev.slice(-2), item]);
  }, []);

  const api = React.useMemo<ToastApi>(
    () => ({
      show,
      success: (title, extra) => show({ title, ...extra, tone: "success" }),
      error: (title, extra) => show({ title, duration: 5000, ...extra, tone: "error" }),
      info: (title, extra) => show({ title, ...extra, tone: "info" }),
      dismiss,
      fromResult: (result, fallback) => {
        if (result.ok) {
          if (result.message ?? fallback) show({ title: result.message ?? fallback ?? "", tone: "success" });
        } else show({ title: result.error, duration: 5000, tone: "error" });
      },
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      <Primitive.Provider swipeDirection="right" duration={3500}>
        {children}
        {items.map((item) => (
          <ToastView key={item.id} item={item} onClose={() => dismiss(item.id)} closeLabel={closeLabel} />
        ))}
        <Primitive.Viewport className="fixed bottom-20 end-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none md:bottom-4" />
      </Primitive.Provider>
    </ToastContext.Provider>
  );
}

const icons: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-accent" aria-hidden />,
  error: <AlertCircle className="size-5 text-error" aria-hidden />,
  info: <Info className="size-5 text-info" aria-hidden />,
};

function ToastView({ item, onClose, closeLabel }: { item: ToastItem; onClose: () => void; closeLabel: string }) {
  return (
    <Primitive.Root
      duration={item.duration}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-md animate-slide-up data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=end]:animate-fade-in",
      )}
    >
      {icons[item.tone]}
      <div className="min-w-0 flex-1">
        <Primitive.Title className="text-sm font-medium text-foreground">{item.title}</Primitive.Title>
        {item.description && <Primitive.Description className="mt-0.5 text-xs text-muted">{item.description}</Primitive.Description>}
        {item.action && (
          <Primitive.Action altText={item.action.label} asChild>
            {item.action.href ? (
              <a href={item.action.href} className="mt-1.5 inline-block text-xs font-semibold underline underline-offset-2">
                {item.action.label}
              </a>
            ) : (
              <button type="button" onClick={item.action.onClick} className="mt-1.5 text-xs font-semibold underline underline-offset-2">
                {item.action.label}
              </button>
            )}
          </Primitive.Action>
        )}
      </div>
      <Primitive.Close aria-label={closeLabel} className="rounded-md p-1 text-muted hover:bg-paper-2 hover:text-foreground">
        <X className="size-4" />
      </Primitive.Close>
    </Primitive.Root>
  );
}

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>");
  return ctx;
}
