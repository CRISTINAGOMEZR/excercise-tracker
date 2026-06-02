import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminMessaging } from '@/lib/firebase-admin';

// Siempre dinámico: no se cachea, se ejecuta cada vez que lo llama el cron.
export const dynamic = 'force-dynamic';

// Mensajes motivadores rotativos (se elige uno al azar cada día).
const MENSAJES = [
  { title: '¡Hora de moverte! 💪', body: 'Mantén viva tu racha: marca tu entrenamiento de hoy.' },
  { title: '¿Ya entrenaste hoy? 🔥', body: 'Un paso a la vez. Tu yo del futuro te lo agradecerá.' },
  { title: 'Tu racha te espera ⭐', body: 'No la rompas hoy. Aunque sean 10 minutos cuentan.' },
  { title: 'Momento de cuidarte 🌱', body: 'Abre la app y registra tu actividad de hoy.' },
  { title: '¡Vamos con todo! 🏆', body: 'Cada entrenamiento suma. Hazlo por ti.' },
];

export async function GET(req: NextRequest) {
  // Seguridad: solo se ejecuta con el secreto correcto.
  // Vercel Cron envía automáticamente el header Authorization: Bearer <CRON_SECRET>.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('secret');

  const autorizado =
    !!secret && (auth === `Bearer ${secret}` || querySecret === secret);

  if (!autorizado) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const adminMessaging = getAdminMessaging();
    const snap = await adminDb.collection('tokens').get();
    const tokens = snap.docs.map((d) => d.get('token') as string).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0, mensaje: 'Sin dispositivos registrados' });
    }

    const msg = MENSAJES[Math.floor(Math.random() * MENSAJES.length)];

    const res = await adminMessaging.sendEachForMulticast({
      tokens,
      notification: { title: msg.title, body: msg.body },
      webpush: {
        notification: { icon: '/icon-192.png', badge: '/icon-192.png' },
        fcmOptions: { link: '/today' },
      },
    });

    // Limpia tokens inválidos (dispositivos que desinstalaron o revocaron permiso).
    const aBorrar: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          aBorrar.push(tokens[i]);
        }
      }
    });
    await Promise.all(aBorrar.map((t) => adminDb.collection('tokens').doc(t).delete()));

    return NextResponse.json({
      ok: true,
      enviados: res.successCount,
      fallidos: res.failureCount,
      limpiados: aBorrar.length,
    });
  } catch (e) {
    console.error('send-reminders error:', e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
