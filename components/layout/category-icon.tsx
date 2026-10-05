"use client";

import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import {
  Utensils, Bed, SprayCan, Package, Briefcase, Dumbbell, Armchair, Wrench, Sparkles, Stethoscope, PartyPopper, Shield,
  Coffee, ShoppingBag, Building2, Scissors, HeartPulse, Tent, Store, Monitor, Shirt, Droplets, Trash2, Box, Printer,
  Lightbulb, Thermometer, Hotel, Grid2x2, type LucideProps,
} from "lucide-react";

/**
 * Icône de catégorie adressable par nom lucide (kebab-case) depuis la base de données.
 * Les icônes les plus courantes sont importées statiquement (rendu immédiat) ;
 * les autres sont chargées à la demande via DynamicIcon ; repli sur une grille.
 */
const staticMap: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils, bed: Bed, "spray-can": SprayCan, package: Package, briefcase: Briefcase, dumbbell: Dumbbell, armchair: Armchair,
  wrench: Wrench, sparkles: Sparkles, stethoscope: Stethoscope, "party-popper": PartyPopper, shield: Shield, coffee: Coffee,
  "shopping-bag": ShoppingBag, "building-2": Building2, scissors: Scissors, "heart-pulse": HeartPulse, tent: Tent, store: Store,
  monitor: Monitor, shirt: Shirt, droplets: Droplets, "trash-2": Trash2, box: Box, printer: Printer, lightbulb: Lightbulb,
  thermometer: Thermometer, hotel: Hotel,
};
const known = new Set<string>(iconNames);

export function CategoryIcon({ icon, ...props }: { icon: string | null | undefined } & Omit<LucideProps, "name" | "ref">) {
  const Static = icon ? staticMap[icon] : undefined;
  if (Static) return <Static aria-hidden {...props} />;
  if (icon && known.has(icon)) return <DynamicIcon name={icon as IconName} aria-hidden fallback={() => <Grid2x2 aria-hidden {...props} />} {...props} />;
  return <Grid2x2 aria-hidden {...props} />;
}
