import { requireStaff } from "@/lib/auth/dal";

export const metadata = { title: { absolute: "Administration — KAYEN" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff("/admin");
  return <>{children}</>;
}
