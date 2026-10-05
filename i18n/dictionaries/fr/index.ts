import { common } from "./common";
import { nav } from "./nav";
import { home } from "./home";
import { catalog } from "./catalog";
import { cart } from "./cart";
import { checkout } from "./checkout";
import { account } from "./account";
import { auth } from "./auth";
import { quote } from "./quote";
import { cms } from "./cms";
import { admin } from "./admin";
import { emails } from "./emails";

export const fr = { common, nav, home, catalog, cart, checkout, account, auth, quote, cms, admin, emails } as const;
export type Dictionary = typeof fr;
