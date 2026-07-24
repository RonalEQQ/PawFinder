const nodemailer = require('nodemailer')

// ── Transporter (singleton) ──────────────────────────────────────
let transporter = null

function getTransporter() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // contraseña de aplicación de 16 dígitos
    },
  })
  return transporter
}

// ── Template HTML del email ──────────────────────────────────────
function templateSimilitud({ nombreDueno, nombreMascota, raza, color, lugar,
                              similitudPct, fotoAvistamiento, tipoNuevo }) {

  const esAvistamiento = tipoNuevo === 'posible_perdido'
  const titulo   = esAvistamiento
    ? `🔍 ¡Avistaron un perro similar a ${nombreMascota || 'tu mascota'}!`
    : `🐾 ¡Nuevo reporte de mascota perdida similar a tu avistamiento!`
  const subtitulo = esAvistamiento
    ? `Alguien reportó un perro en la zona que podría ser tu mascota.`
    : `Se registró un nuevo perro perdido con características similares a tu avistamiento.`

  const colorBarra = similitudPct >= 70 ? '#27ae60' : similitudPct >= 40 ? '#E07B27' : '#1A7A7A'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PawFinder — Notificación</title>
</head>
<body style="margin:0;padding:0;background:#F2EDE3;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2EDE3;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#036668,#077878);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🐾</div>
            <div style="color:white;font-size:22px;font-weight:800;letter-spacing:-0.3px;">PawFinder</div>
            <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Mascotas Puno</div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:white;padding:32px;">

            <!-- Saludo -->
            <p style="margin:0 0 6px;font-size:15px;color:#0B5C5C;font-weight:700;">
              Hola${nombreDueno ? ', ' + nombreDueno : ''}
            </p>
            <h1 style="margin:0 0 10px;font-size:20px;font-weight:900;color:#0e3e46;line-height:1.3;">
              ${titulo}
            </h1>
            <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;line-height:1.6;">
              ${subtitulo}
            </p>

            <!-- Card de similitud -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F2EDE3;border-radius:12px;border:1.5px solid #E8DFC8;margin-bottom:24px;">
              <tr>
                ${fotoAvistamiento ? `
                <td width="90" style="padding:16px 0 16px 16px;vertical-align:top;">
                  <img src="${fotoAvistamiento}" alt="Foto"
                    style="width:80px;height:80px;border-radius:10px;object-fit:cover;border:2px solid #D9C4A0;display:block;"/>
                </td>` : ''}
                <td style="padding:16px;">
                  ${raza    ? `<div style="font-size:13px;color:#888;margin-bottom:3px;">Raza</div>
                    <div style="font-size:15px;font-weight:800;color:#0e3e46;margin-bottom:10px;">${raza}</div>` : ''}
                  ${color   ? `<div style="font-size:13px;color:#888;margin-bottom:3px;">Color</div>
                    <div style="font-size:14px;font-weight:600;color:#444;margin-bottom:10px;">${color}</div>` : ''}
                  ${lugar   ? `<div style="font-size:13px;color:#888;margin-bottom:3px;">Zona</div>
                    <div style="font-size:14px;font-weight:600;color:#444;">${lugar}</div>` : ''}
                </td>
              </tr>
            </table>

            <!-- Barra de similitud -->
            <div style="margin-bottom:28px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-size:13px;font-weight:700;color:#0B5C5C;">Similitud detectada</span>
                <span style="font-size:18px;font-weight:900;color:${colorBarra};">${similitudPct}%</span>
              </div>
              <div style="background:#eee;border-radius:6px;height:8px;overflow:hidden;">
                <div style="background:${colorBarra};height:8px;width:${similitudPct}%;border-radius:6px;"></div>
              </div>
            </div>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="http://localhost:5173/Reportes"
                    style="display:inline-block;background:linear-gradient(135deg,#E07B27,#c96a1a);
                    color:white;font-size:15px;font-weight:800;text-decoration:none;
                    padding:14px 36px;border-radius:40px;letter-spacing:0.2px;">
                    🔍 Ver el avistamiento en PawFinder
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:12px;color:#aaa;text-align:center;margin:0;">
              Si el perro no es tuyo, ignora este mensaje.<br/>
              Recibiste este correo porque tienes un reporte activo en PawFinder Puno.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#036668;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">
              PawFinder — Mascotas Puno &nbsp;|&nbsp;
              <a href="http://localhost:5173" style="color:rgba(255,255,255,0.6);text-decoration:none;">
                localhost:5173
              </a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Función principal: enviar email de similitud ─────────────────
async function enviarEmailSimilitud({ emailDestinatario, nombreDueno,
                                      nombreMascota, raza, color, lugar,
                                      similitudPct, fotoAvistamiento, tipoNuevo }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  EMAIL_USER/EMAIL_PASS no configurados — email omitido')
    return false
  }
  if (!emailDestinatario) {
    console.log('⚠️  Sin email de destinatario — email omitido')
    return false
  }
  try {
    const html = templateSimilitud({ nombreDueno, nombreMascota, raza, color,
                                      lugar, similitudPct, fotoAvistamiento, tipoNuevo })
    const esAvistamiento = tipoNuevo === 'posible_perdido'
    const asunto = esAvistamiento
      ? `🔍 Avistaron un perro similar a ${nombreMascota || 'tu mascota'} — PawFinder`
      : `🐾 Nuevo reporte similar a tu avistamiento — PawFinder`

    await getTransporter().sendMail({
      from:    `"PawFinder Puno 🐾" <${process.env.EMAIL_USER}>`,
      to:      emailDestinatario,
      subject: asunto,
      html,
    })
    console.log(`✅ Email enviado a ${emailDestinatario} (similitud ${similitudPct}%)`)
    return true
  } catch (e) {
    console.error(`❌ Error enviando email a ${emailDestinatario}:`, e.message)
    return false
  }
}

// ── Template HTML campaña ────────────────────────────────────────
function templateCampana({ nombreUsuario, nombreCampana, tipoCampana, zona, lugar,
                            fechaInicio, fechaFin, horaInicio, horaFin, descripcion, imagen }) {
  const fechaIniStr = fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  const fechaFinStr = fechaFin ? new Date(fechaFin).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
  const horaStr = horaInicio ? `${horaInicio}${horaFin ? ' - ' + horaFin : ''}` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PawFinder — Nueva Campaña</title>
</head>
<body style="margin:0;padding:0;background:#F2EDE3;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2EDE3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#384d51 0%,#0b2643 60%,#4A9DA4 100%);padding:32px 28px 24px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:3px;text-transform:uppercase;">PawFinder · Puno, Perú</p>
            <h1 style="margin:0;color:#eda51f;font-size:26px;font-weight:900;">💉 Nueva Campaña</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Hay una nueva campaña disponible para tu mascota</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:28px;">

            ${nombreUsuario ? `<p style="margin:0 0 20px;font-size:15px;color:#384d51;">Hola <strong>${nombreUsuario}</strong> 👋</p>` : ''}

            <!-- Card campaña -->
            <div style="background:#F2EDE3;border-radius:14px;padding:20px;margin-bottom:20px;border-left:4px solid #eda51f;">
              <h2 style="margin:0 0 6px;font-size:18px;color:#0b2643;font-weight:900;">${nombreCampana}</h2>
              ${tipoCampana ? `<span style="display:inline-block;background:#eda51f;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:12px;">${tipoCampana}</span>` : ''}

              <table cellpadding="0" cellspacing="0" width="100%">
                ${zona ? `<tr><td style="padding:4px 0;font-size:13px;color:#384d51;">📍 <strong>Zona:</strong> ${zona}</td></tr>` : ''}
                ${lugar ? `<tr><td style="padding:4px 0;font-size:13px;color:#384d51;">🏠 <strong>Lugar:</strong> ${lugar}</td></tr>` : ''}
                ${fechaIniStr ? `<tr><td style="padding:4px 0;font-size:13px;color:#384d51;">📅 <strong>Fechas:</strong> ${fechaIniStr}${fechaFinStr ? ' al ' + fechaFinStr : ''}</td></tr>` : ''}
                ${horaStr ? `<tr><td style="padding:4px 0;font-size:13px;color:#384d51;">🕐 <strong>Horario:</strong> ${horaStr}</td></tr>` : ''}
              </table>

              ${descripcion ? `<p style="margin:12px 0 0;font-size:13px;color:#384d51;line-height:1.6;">${descripcion}</p>` : ''}
            </div>

            ${imagen ? `<div style="text-align:center;margin-bottom:20px;"><img src="${imagen}" alt="Campaña" style="max-width:100%;border-radius:12px;max-height:200px;object-fit:cover;"/></div>` : ''}

            <!-- CTA -->
            <div style="text-align:center;margin:24px 0 8px;">
              <a href="https://paw-finder-kohl.vercel.app/campanas"
                 style="display:inline-block;background:linear-gradient(135deg,#eda51f,#d4a017);color:#fff;font-weight:900;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
                Ver campaña completa →
              </a>
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0c5962;padding:16px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.6);font-size:11px;">
              PawFinder — Mascotas Puno &nbsp;|&nbsp;
              <a href="https://paw-finder-kohl.vercel.app" style="color:rgba(255,255,255,0.6);text-decoration:none;">paw-finder-kohl.vercel.app</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Función: enviar email de campaña a un usuario ────────────────
async function enviarEmailCampana({ emailDestinatario, nombreUsuario, nombreCampana,
                                    tipoCampana, zona, lugar, fechaInicio, fechaFin,
                                    horaInicio, horaFin, descripcion, imagen }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  EMAIL_USER/EMAIL_PASS no configurados — email omitido')
    return false
  }
  if (!emailDestinatario) return false
  try {
    const html = templateCampana({ nombreUsuario, nombreCampana, tipoCampana, zona,
                                    lugar, fechaInicio, fechaFin, horaInicio, horaFin,
                                    descripcion, imagen })
    await getTransporter().sendMail({
      from:    `"PawFinder Puno 🐾" <${process.env.EMAIL_USER}>`,
      to:      emailDestinatario,
      subject: `💉 Nueva campaña: ${nombreCampana} — PawFinder`,
      html,
    })
    console.log(`✅ Email campaña enviado a ${emailDestinatario}`)
    return true
  } catch (e) {
    console.error(`❌ Error enviando email campaña a ${emailDestinatario}:`, e.message)
    return false
  }
}

module.exports = { enviarEmailSimilitud, enviarEmailCampana }