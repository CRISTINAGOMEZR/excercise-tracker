'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addEjercicio } from '@/lib/firestore';
import { uploadVideo } from '@/lib/storage';
import { isValidVideoLink, youtubeThumbnail, getYouTubeId } from '@/lib/videoUtils';
import { CATEGORIAS, type Categoria } from '@/types';

type Tab = 'link' | 'upload';

export default function AddExerciseForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('link');
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<Categoria>(CATEGORIAS[0]);
  const [duracionMin, setDuracionMin] = useState('');
  const [notas, setNotas] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      if (!file) { setError('Selecciona un archivo de video.'); return; }
    }

    setLoading(true);
    try {
      let videoUrl = url;
      let miniatura: string | undefined;

      if (tab === 'upload' && file) {
        videoUrl = await uploadVideo(file, setProgress);
      } else {
        const ytId = getYouTubeId(url);
        if (ytId) miniatura = youtubeThumbnail(ytId);
      }

      await addEjercicio({
        titulo:      titulo.trim(),
        tipo:        tab,
        url:         videoUrl,
        miniatura,
        categoria,
        duracionMin: duracionMin ? Number(duracionMin) : undefined,
        notas:       notas.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => router.push('/library'), 1500);
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
            {t === 'link' ? 'Enlace YouTube / Vimeo' : 'Subir video'}
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
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="ej. Sentadillas 10 min"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Video source */}
      {tab === 'link' ? (
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
            URL del video *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={inputClass}
            style={inputStyle}
          />
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
          ✓ ¡Ejercicio guardado! Redirigiendo a tu biblioteca…
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
            : 'Guardar ejercicio'}
      </button>
    </form>
  );
}
