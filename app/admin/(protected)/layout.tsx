import Link from "next/link"
import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/supabase/admin-auth"

export const dynamic = "force-dynamic"

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()
  if (!user) redirect("/admin/login")

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-6 px-4 text-sm">
          <Link href="/admin" className="font-semibold">
            Pensión+ Admin
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            Leads
          </Link>
          <span className="ml-auto text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
