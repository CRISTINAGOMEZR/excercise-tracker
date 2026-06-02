import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeId, getVimeoId, getInstagram, youtubeThumbnail } from '@/lib/videoUtils';

export const dynamic = 'force-dynamic';

interface Meta {
  title: string | null;
  thumbnail: string | null;
  provider: 'youtube' | 'vimeo' | 'instagram' | null;
}

// Extrae el contenido de una meta etiqueta og:* del HTML.
function ogTag(html: string, prop: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const m = html.match(re);
  if (m) return decodeHtml(m[1]);
  // Algunas páginas ponen content antes de property.
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    'i'
  );
  const m2 = html.match(re2);
  return m2 ? decodeHtml(m2[1]) : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') ?? '';
  if (!url) return NextResponse.json({ error: 'Falta url' }, { status: 400 });

  const result: Meta = { title: null, thumbnail: null, provider: null };

  try {
    // ── YouTube ──────────────────────────────────────────────
    const yt = getYouTubeId(url);
    if (yt) {
      result.provider = 'youtube';
      result.thumbnail = youtubeThumbnail(yt);
      try {
        const r = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
          { cache: 'no-store' }
        );
        if (r.ok) {
          const j = await r.json();
          result.title = j.title ?? null;
          if (j.thumbnail_url) result.thumbnail = j.thumbnail_url;
        }
      } catch {}
      return NextResponse.json(result);
    }

    // ── Vimeo ────────────────────────────────────────────────
    const vm = getVimeoId(url);
    if (vm) {
      result.provider = 'vimeo';
      try {
        const r = await fetch(
          `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
          { cache: 'no-store' }
        );
        if (r.ok) {
          const j = await r.json();
          result.title = j.title ?? null;
          result.thumbnail = j.thumbnail_url ?? null;
        }
      } catch {}
      return NextResponse.json(result);
    }

    // ── Instagram ────────────────────────────────────────────
    // Sin token de la Graph API no hay oEmbed oficial, así que leemos las
    // etiquetas Open Graph de la página pública (funciona con reels/posts
    // públicos; si Instagram lo bloquea, el usuario igual puede poner título).
    const ig = getInstagram(url);
    if (ig) {
      result.provider = 'instagram';
      try {
        const r = await fetch(`https://www.instagram.com/${ig.type}/${ig.code}/`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)',
            'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
          },
          cache: 'no-store',
        });
        if (r.ok) {
          const html = await r.text();
          result.thumbnail = ogTag(html, 'og:image');
          const ogTitle = ogTag(html, 'og:title');
          const ogDesc = ogTag(html, 'og:description');
          // og:title suele ser el autor; la descripción tiene el texto del post.
          result.title = ogDesc || ogTitle || null;
        }
      } catch {}
      return NextResponse.json(result);
    }

    return NextResponse.json({ ...result, error: 'Enlace no compatible' }, { status: 422 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ...result, error: msg }, { status: 500 });
  }
}
