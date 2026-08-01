export type DeliveryStatus = {
  messageId?: string
  status?: string
  recipient?: string
  error?: { code?: number; title?: string; details?: string }
}

type RawStatus = {
  id?: string
  status?: string
  recipient_id?: string
  errors?: {
    code?: number
    title?: string
    message?: string
    error_data?: { details?: string }
  }[]
}

// Meta manda los acuses de entrega (sent/delivered/read/failed) por el mismo
// webhook que los mensajes entrantes. Sin esto, un envío rechazado se ve igual
// que uno exitoso: el API responde "accepted" y el motivo real solo llega aquí.
export function extractStatuses(body: unknown): DeliveryStatus[] {
  const entries =
    (body as { entry?: { changes?: { value?: { statuses?: RawStatus[] } }[] }[] })
      ?.entry ?? []
  return entries.flatMap(
    (e) =>
      e.changes?.flatMap((c) =>
        (c.value?.statuses ?? []).map((s) => {
          const err = s.errors?.[0]
          return {
            messageId: s.id,
            status: s.status,
            recipient: s.recipient_id,
            error: err
              ? {
                  code: err.code,
                  title: err.title ?? err.message,
                  details: err.error_data?.details,
                }
              : undefined,
          }
        })
      ) ?? []
  )
}
