import { z } from "zod"
import { normalizePhoneMX, validateCURP, validateNSS } from "./identifiers"

export const preQualifierSchema = z.object({
  fullName: z.string().trim().min(5, "Escribe tu nombre completo"),
  phone: z
    .string()
    .transform((v, ctx) => {
      const normalized = normalizePhoneMX(v)
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Escribe un teléfono mexicano de 10 dígitos",
        })
        return z.NEVER
      }
      return normalized
    }),
  email: z.string().trim().email("Correo inválido").optional().or(z.literal("")),
  nss: z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (!v || !v.trim()) return undefined
      const r = validateNSS(v)
      if (!r.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El NSS debe tener 11 dígitos",
        })
        return z.NEVER
      }
      return r.normalized!
    }),
  curp: z.string().transform((v, ctx) => {
    const r = validateCURP(v)
    if (!r.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La CURP no tiene un formato válido",
      })
      return z.NEVER
    }
    return r.normalized!
  }),
  fechaBaja: z.coerce.date({ message: "Indica tu fecha de baja" }),
  monthlySalary: z.coerce
    .number({ message: "Indica tu último salario mensual" })
    .min(1000, "Indica tu salario mensual bruto aproximado")
    .max(1000000, "Verifica el salario capturado"),
  yearsContributing: z.coerce
    .number({ message: "Indica los años cotizando" })
    .min(0)
    .max(60),
  lastWithdrawalWithin5y: z.coerce.boolean(),
  expedienteActualizado: z.enum(["si", "no", "nose"]).optional(),
  cuentaBancaria: z.enum(["si", "no", "nose"]).optional(),
  privacyConsent: z.literal(true, {
    message: "Necesitas aceptar el aviso de privacidad para continuar",
  }),
  sourceRef: z.string().optional(),
})

export type PreQualifierInput = z.infer<typeof preQualifierSchema>

export const leadCaptureSchema = z.object({
  // Captura progresiva: el nombre es opcional (llega en una captura posterior);
  // vacío/espacios se trata como ausente, pero si viene algo, mínimo 5 chars.
  fullName: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional()
    .refine((v) => v === undefined || v.length >= 5, "Escribe tu nombre completo"),
  phone: z.string().transform((v, ctx) => {
    const normalized = normalizePhoneMX(v)
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Teléfono inválido" })
      return z.NEVER
    }
    return normalized
  }),
  monthlySalary: z.coerce.number().min(1000).max(1000000).optional(),
  sourceRef: z.string().optional(),
})

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>

export const otpSendSchema = z.object({
  token: z.string().uuid(),
})

export const signSchema = z.object({
  token: z.string().uuid(),
  otp: z.string().regex(/^\d{6}$/, "El código es de 6 dígitos"),
  signaturePngBase64: z
    .string()
    .min(100, "Falta la firma")
    .max(500_000, "La firma es demasiado grande"),
})
