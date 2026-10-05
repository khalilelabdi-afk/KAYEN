import {
  Utensils, Bed, SprayCan, Package, Briefcase, Dumbbell, Armchair, Wrench, Sparkles, Stethoscope, PartyPopper, Shield,
  Coffee, ShoppingBag, Building2, Scissors, HeartPulse, Tent, Store, Monitor, Shirt, Droplets, Trash2, Box, Printer,
  Lightbulb, Thermometer, BriefcaseBusiness, Hotel, Grid2x2, type LucideProps,
} from "lucide-react";

/** Sous-ensemble d'icônes lucide adressables par nom (kebab-case) depuis la base de données. */
const map: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils, bed: Bed, "spray-can": SprayCan, package: Package, briefcase: Briefcase, dumbbell: Dumbbell, armchair: Armchair,
  wrench: Wrench, sparkles: Sparkles, stethoscope: Stethoscope, "party-popper": PartyPopper, shield: Shield, coffee: Coffee,
  "shopping-bag": ShoppingBag, "building-2": Building2, scissors: Scissors, "heart-pulse": HeartPulse, tent: Tent, store: Store,
  monitor: Monitor, shirt: Shirt, droplets: Droplets, "trash-2": Trash2, box: Box, printer: Printer, lightbulb: Lightbulb,
  thermometer: Thermometer, "briefcase-business": BriefcaseBusiness, hotel: Hotel,
};

export function CategoryIcon({ icon, ...props }: { icon: string | null | undefined } & Omit<LucideProps, "name"> ) {
  const Icon = (icon && map[icon]) || Grid2x2;
  return <Icon aria-hidden {...props} />;
}
