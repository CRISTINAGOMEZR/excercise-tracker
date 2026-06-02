/** Extrae el ID de un enlace de YouTube. Devuelve null si no es válido. */
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Extrae el ID de un enlace de Vimeo. Devuelve null si no es válido. */
export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

/** Extrae el tipo y código de un enlace de Instagram (reel / post / tv). */
export function getInstagram(url: string): { type: string; code: string } | null {
  const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  // "reels" (plural) y "reel" apuntan al mismo recurso; normalizamos a "reel".
  const type = m[1] === 'reels' ? 'reel' : m[1];
  return { type, code: m[2] };
}

/** Devuelve la URL del thumbnail de YouTube dado su ID. */
export function youtubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** Identifica el proveedor del enlace. */
export function getProvider(url: string): 'youtube' | 'vimeo' | 'instagram' | null {
  if (getYouTubeId(url)) return 'youtube';
  if (getVimeoId(url)) return 'vimeo';
  if (getInstagram(url)) return 'instagram';
  return null;
}

/** Valida si una URL es de YouTube, Vimeo o Instagram. */
export function isValidVideoLink(url: string): boolean {
  return getProvider(url) !== null;
}

/** Devuelve la URL embed para YouTube, Vimeo o Instagram. */
export function getEmbedUrl(url: string): string | null {
  const yt = getYouTubeId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1`;
  const vm = getVimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}?autoplay=1`;
  const ig = getInstagram(url);
  if (ig) return `https://www.instagram.com/${ig.type}/${ig.code}/embed`;
  return null;
}

/** ¿El embed es vertical (reel/short)? Sirve para ajustar el aspect ratio. */
export function isVerticalEmbed(url: string): boolean {
  return getInstagram(url) !== null || /youtube\.com\/shorts\//.test(url);
}
