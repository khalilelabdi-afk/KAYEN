/** Données de navigation sérialisables (passées aux composants client). */
export interface NavCategory {
  id: string;
  name: string;
  href: string;
  icon: string | null;
  image: string | null;
  productCount: number;
  showInNav: boolean;
  children: NavCategory[];
}

export interface NavSector {
  name: string;
  href: string;
  icon: string | null;
}

export interface NavBrand {
  name: string;
  href: string;
}

export interface NavData {
  categories: NavCategory[];
  sectors: NavSector[];
  brands: NavBrand[];
}

export interface HeaderUser {
  firstName: string;
  businessName: string | null;
  isStaff: boolean;
}
