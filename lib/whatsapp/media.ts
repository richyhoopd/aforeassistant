// Los medios de WhatsApp caducan en los servidores de Meta (~30 días):
// se descargan al recibirlos y se guardan en nuestro Storage.

export type DownloadedMedia = { data: ArrayBuffer; mimeType?: string }

export async function downloadWhatsAppMedia(
  mediaId: string,
  token: string
): Promise<DownloadedMedia | null> {
  const headers = { Authorization: `Bearer ${token}` }
  try {
    const metaRes = await fetch(`https://graph.facebook.com/v23.0/${mediaId}`, {
      headers,
    })
    if (!metaRes.ok) return null
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string }
    if (!meta.url) return null

    const blobRes = await fetch(meta.url, { headers })
    if (!blobRes.ok) return null
    return { data: await blobRes.arrayBuffer(), mimeType: meta.mime_type }
  } catch {
    return null
  }
}
