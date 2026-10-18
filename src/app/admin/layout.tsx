import { connection } from "next/server";

export const instant = false;

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  return children;
}
