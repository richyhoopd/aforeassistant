// Uso: npx tsx scripts/create-admin.ts correo@dominio.com contraseña
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno.
import { createClient } from "@supabase/supabase-js"

const [email, password] = process.argv.slice(2)
if (!email || !password) {
  console.error("Uso: npx tsx scripts/create-admin.ts <email> <password>")
  process.exit(1)
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const { data, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { app_role: "admin" },
})
if (error) {
  console.error(error.message)
  process.exit(1)
}
console.log(`Admin creado: ${data.user.email} (${data.user.id})`)
