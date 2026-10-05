import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/cart", "/api", "/search", "/login", "/register", "/reset-password", "/verify-email"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
