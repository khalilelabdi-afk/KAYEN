"use client";

import * as React from "react";
import { Tabs as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;

export const TabsList = React.forwardRef<React.ComponentRef<typeof Primitive.List>, React.ComponentPropsWithoutRef<typeof Primitive.List>>(
  ({ className, ...props }, ref) => (
    <Primitive.List
      ref={ref}
      className={cn("flex w-full gap-6 overflow-x-auto border-b border-border scrollbar-none", className)}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<React.ComponentRef<typeof Primitive.Trigger>, React.ComponentPropsWithoutRef<typeof Primitive.Trigger>>(
  ({ className, ...props }, ref) => (
    <Primitive.Trigger
      ref={ref}
      className={cn(
        "-mb-px whitespace-nowrap border-b-2 border-transparent py-3 text-sm font-medium text-muted transition-colors hover:text-foreground data-[state=active]:border-ink data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<React.ComponentRef<typeof Primitive.Content>, React.ComponentPropsWithoutRef<typeof Primitive.Content>>(
  ({ className, ...props }, ref) => <Primitive.Content ref={ref} className={cn("pt-6 focus:outline-none", className)} {...props} />,
);
TabsContent.displayName = "TabsContent";
