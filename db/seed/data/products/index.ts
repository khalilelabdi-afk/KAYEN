import type { SeedProduct } from "../../types";
import { restaurationProducts } from "./restauration";
import { hotellerieProducts } from "./hotellerie";
import { hygieneProducts } from "./hygiene";
import { fitnessProducts } from "./fitness";
import { bureauProducts } from "./bureau";

export const allProducts: SeedProduct[] = [...restaurationProducts, ...hotellerieProducts, ...hygieneProducts, ...fitnessProducts, ...bureauProducts];
