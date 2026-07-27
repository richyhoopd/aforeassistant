import "server-only"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export async function supabaseSession() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try {
            all.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll desde un Server Component: ignorable, el middleware refresca
          }
        },
      },
    }
  )
}

export async function getAdminUser() {
  const supabase = await supabaseSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  if (user.app_metadata?.app_role !== "admin") return null
  return user
}
