# Pendientes que solo Ricardo puede resolver

- **Cifras de pensión garantizada** (`$3,414 / $6,000 / $10,732`): se copiaron de la versión anterior sin verificar. Confirmar el monto vigente en el IMSS y citar año y fuente en la sección.
- **Entidad responsable en `/privacidad`**: dice "Grupo Inmobiliario HeredaBienes". Confirmar que es la entidad correcta para Pensión+.
- **Renombrar** repo `aforeassistant` → `pensionmas` y proyecto Vercel `aforeassistant` → `pensionmas` (opcional, cosmético): `gh repo rename pensionmas -R richyhoopd/aforeassistant` y `https://vercel.com/lidfis-projects/aforeassistant/settings`.
- **Fotos de stock heredadas de la landing anterior** (`public/images/*`): confirmar licencia antes de pauta.
- **Twitter/X** `@pensionmasmx` está en la metadata: confirmar que la cuenta sigue viva o quitarla.
- Reseñas del hero: son las de la landing anterior (hablan del trámite de retiro por desempleo, CURP y NSS), no de pensión. Decidir si se reescriben para Pensión+ o se quitan. Ratings y "+500 personas" no tienen fuente.
- Teléfonos: resuelto el 4-sep. El único número de Pensión+ (WhatsApp y teléfono) es +52 (33) 4969-8324; todos los botones de contacto abren WhatsApp a ese número.
- Cifras del original que se contradicen: "hasta 300%" (hero) vs "hasta un 40%" (calculadora); "optimizada" = pensión × 2.5 en el resultado Ley 73 (viene del código original). Decidir qué se muestra.
- **Correo con Resend (decidido 4-sep):** el resultado de la calculadora se envía por `/api/resultado`. Para que funcione en producción: (1) crear cuenta en https://resend.com y agregar el dominio `pensionmas.com.mx` en https://resend.com/domains (DNS: registros SPF/DKIM que te da Resend, en el DNS del dominio); (2) crear API key en https://resend.com/api-keys; (3) en https://vercel.com/lidfis-projects/aforeassistant/settings/environment-variables cargar `RESEND_API_KEY`, `RESULT_FROM` (`Pensión+ <resultados@pensionmas.com.mx>`) y opcionalmente `RESULT_BCC` con tu correo para recibir cada lead; (4) redeploy. Sin la key, el formulario del popup muestra "No pudimos enviarlo".
- **Términos y condiciones** (`/terminos`): redactados como borrador. Revisar con abogado y confirmar la entidad responsable (hoy dice "Grupo Inmobiliario HeredaBienes", igual que en `/privacidad`) antes de pauta.
- **Testimonios sin calificación**: el copy original que quedó en el repo no trae rating por testimonio, así que las cards de la sección "Por qué Pensión+" muestran iniciales, nombre y texto. Si hay ratings reales, pasarlos y se agregan.
