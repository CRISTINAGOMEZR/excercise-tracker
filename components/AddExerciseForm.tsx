'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addEjercicio, updateEjercicio } from '@/lib/firestore';
import { uploadVideo } from '@/lib/storage';
import { isValidVideoLink, getProvider } from '@/lib/videoUtils';
import { IconCheck, IconPlay } from '@/components/icons';
import { CATEGORIAS, type Categoria, type Exercise } from '@/types';

const PROVIDER_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  instagram: 'Instagram',
};

type Tab = 'link' | 'upload';

export default function AddExerciseForm({ initial }: { initial?: Exercise }) {
  const router = useRouter();
  const editing = !!initial;
  const [tab, setTab] = useState<Tab>(initial?.tipo ?? 'link');
  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [categoria, setCategoria] = useState<Categoria>((initial?.categoria as Categoria) ?? CATEGORIAS[0]);
  const [duracionMin, setDuracionMin] = useState(initial?.duracionMin ? String(initial.duracionMin) : '');
  const [notas, setNotas] = useState(initial?.notas ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Importación automática (preview)
  const [importing, setImporting] = useState(false);
  const [fetchedThumb, setFetchedThumb] = useState<string | null>(initial?.miniatura ?? null);
  const [fetchedProvider, setFetchedProvider] = useState<string | null>(null);
  const [titleTouched, setTitleTouched] = useState(editing);

  // Cuando se pega un enlace válido, trae título + miniatura automáticamente.
  useEffect(() => {
    if (tab !== 'link') return;
    const link = url.trim();
    if (!isValidVideoLink(link)) {
      setFetchedThumb(null);
      setFetchedProvider(null);
      return;
    }
    let cancel = false;
    setImporting(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/oembed?url=${encodeURIComponent(link)}`);
        const j = await r.json();
        if (cancel) return;
        setFetchedProvider(j.provider ?? getProvider(link));
        setFetchedThumb(j.thumbnail ?? null);
        // Auto-rellena el título solo si el usuario no lo ha escrito a mano.
        if (j.title && !titleTouched) setTitulo(j.title.slice(0, 120));
      } catch {
        if (!cancel) setFetchedProvider(getProvider(link));
      } finally {
        if (!cancel) setImporting(false);
      }
    }, 600);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!titulo.trim()) { setError('El título es obligatorio.'); return; }

    if (tab === 'link') {
      if (!isValidVideoLink(url)) {
        setError('Pega un enlace válido de YouTube o Vimeo.');
        return;
      }
    } else {
      // Al editar un video subido se permite conservar el archivo existente.
      if (!file && !editing) { setError('Selecciona un archivo de video.'); return; }
    }

    setLoading(true);
    try {
      let videoUrl = url;
      let miniatura: string | undefined;

      if (tab === 'upload' && file) {
        const res = await uploadVideo(file, setProgress);
        videoUrl = res.url;
        if (res.thumbnail) miniatura = res.thumbnail;
      } else {
        videoUrl = url.trim();
        if (fetchedThumb) miniatura = fetchedThumb;
      }

      const payload = {
        titulo:      titulo.trim(),
        tipo:        tab,
        url:         videoUrl,
        miniatura,
        categoria,
        duracionMin: duracionMin ? Number(duracionMin) : undefined,
        notas:       notas.trim() || undefined,
      };

      if (editing && initial) {
        await updateEjercicio(initial.id, payload);
      } else {
        await addEjercicio(payload);
      }

      setSuccess(true);
      setTimeout(() => router.push('/library'), 1200);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const msg = (err as { message?: string })?.message ?? String(err);
      setError(`Error: ${code ?? ''} ${msg}`.trim());
      console.error(err);
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 ring-sage-400/30';
  const inputStyle = {
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-dm-sans)',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tab: link vs upload */}
      <div
        className="flex rounded-xl p-1"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {(['link', 'upload'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--color-text)' : 'var(--color-muted)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t === 'link' ? 'Importar enlace' : 'Subir video'}
          </button>
        ))}
      </div>

      {/* Título */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Título *
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => { setTitulo(e.target.value); setTitleTouched(true); }}
          placeholder="ej. Sentadillas 10 min"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Video source */}
      {tab === 'link' ? (
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
            Pega el enlace del video *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube, Vimeo o Instagram (reel/post)"
            className={inputClass}
            style={inputStyle}
          />

          {/* Estado / preview de la importación */}
          {url.trim() && !isValidVideoLink(url) && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-muted)' }}>
              Pega un enlace de YouTube, Vimeo o Instagram.
            </p>
          )}

          {importing && (
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
              Importando datos del video…
            </div>
          )}

          {!importing && fetchedProvider && (
            <div
              className="mt-3 rounded-xl overflow-hidden flex gap-3 p-2"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="relative flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: 96, height: 64, backgroundColor: 'var(--color-border)' }}
              >
                {fetchedThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fetchedThumb} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-40"><IconPlay size={20} /></div>
                )}
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <span
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-medium mb-0.5"
                  style={{ color: 'var(--color-accent)' }}
                >
                  <IconCheck size={12} /> {PROVIDER_LABEL[fetchedProvider] ?? 'Video'} detectado
                </span>
                <p className="text-sm leading-snug line-clamp-2" style={{ color: 'var(--color-text)' }}>
                  {titulo || 'Listo para guardar'}
                </p>
                {!fetchedThumb && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Sin miniatura automática (puedes guardarlo igual).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
            Archivo de video *
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={inputClass}
            style={{ ...inputStyle, paddingTop: '10px' }}
          />
          {file && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
          {editing && !file && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Se conservará el video actual si no eliges otro.
            </p>
          )}
          {loading && progress > 0 && (
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, backgroundColor: 'var(--color-accent)' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Categoría */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Categoría
        </label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria)}
          className={inputClass}
          style={inputStyle}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Duración */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Duración (minutos)
        </label>
        <input
          type="number"
          min="1"
          max="999"
          value={duracionMin}
          onChange={(e) => setDuracionMin(e.target.value)}
          placeholder="ej. 15"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Notas personales
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Recordatorios, modificaciones..."
          rows={3}
          className={inputClass}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm px-1" style={{ color: 'var(--color-terracotta, #b56f54)' }}>
          {error}
        </p>
      )}

      {/* Éxito */}
      {success && (
        <p className="text-sm px-1" style={{ color: 'var(--color-accent)' }}>
          ✓ ¡Ejercicio {editing ? 'actualizado' : 'guardado'}! Redirigiendo a tu biblioteca…
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl text-white font-medium text-sm transition-opacity disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {success
          ? '✓ ¡Guardado!'
          : loading
            ? (tab === 'upload' && progress > 0 ? `Subiendo ${progress}%…` : 'Guardando…')
            : editing ? 'Guardar cambios' : 'Guardar ejercicio'}
      </button>
    </form>
  );
}
