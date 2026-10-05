import type { PartialDictionary } from "@/i18n/types";
import type { Dictionary } from "../fr";

/**
 * Dictionnaire arabe — partiel (RTL pris en charge par la configuration de locale).
 * Toute clé absente retombe sur le français.
 */
export const ar: PartialDictionary<Dictionary> = {
  common: {
    tagline: "كل ما يحتاجه عملك، بالجملة.",
    actions: { addToCart: "أضف إلى السلة", requestQuote: "طلب عرض سعر", search: "بحث", login: "تسجيل الدخول", logout: "تسجيل الخروج", register: "إنشاء حساب" },
    breadcrumb: { home: "الرئيسية" },
    skipToContent: "الانتقال إلى المحتوى",
  },
  nav: {
    header: { searchPlaceholder: "ابحث بين آلاف المنتجات...", allProducts: "جميع المنتجات", cart: "السلة", account: "الحساب" },
  },
  home: {
    hero: { title: "كل ما يحتاجه عملك. بالجملة.", subtitle: "آلاف المنتجات المهنية، أسعار حسب الكمية، وتوريد مبسّط.", ctaPrimary: "اكتشف المنتجات", ctaSecondary: "طلب عرض سعر" },
  },
};
