"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Erişilebilir yan panel (Radix Dialog): odak kilidi, Esc ile kapanma, arka plan kaydırma kilidi,
 * odak geri dönüşü. Sepet, mobil menü ve filtre çekmecesi için ortak.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
  footer,
  className,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: string;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  trigger?: React.ReactNode;
}) {
  const sideCls = {
    right: "inset-y-0 right-0 h-dvh w-full max-w-[440px] data-[state=open]:animate-[sheet-in-right_.45s_var(--ease-premium)]",
    left: "inset-y-0 left-0 h-dvh w-[88vw] max-w-[400px] data-[state=open]:animate-[sheet-in-left_.45s_var(--ease-premium)]",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-[28px] data-[state=open]:animate-[sheet-in-bottom_.45s_var(--ease-premium)]",
  }[side];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-fade" />
        <Dialog.Content className={cn("fixed z-[70] flex flex-col bg-paper shadow-pop outline-none", sideCls, className)}>
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <Dialog.Title className="font-display text-xl font-extrabold">{title}</Dialog.Title>
            <Dialog.Close className="icon-btn -mr-2" aria-label="Kapat">
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {description ? <Dialog.Description className="sr-only">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Panel"}</Dialog.Description>}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer ? <div className="border-t border-line bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
