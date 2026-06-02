'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addRutina, updateRutina } from '@/lib/firestore';
import { uploadVideo } from '@/lib/storage';
import { isValidVideoLink, getProvider } from '@/lib/videoUtils';
import { FASES, ORDEN_FASE, type Fase, type Rutina, type RutinaItem } from '@/types';

const PROVIDER_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  instagram: 'Instagram',
};

const FASE_COLOR: Record<Fase, string> = {
  Calentamiento: '#d99a6c',
  Normal: '#7a9670',
  Enfriamiento: '#6c93b3',
};

type Tab = 'link' | 'upload';

const inputClass = 'w-full rounded-xl px-4 py-3 text-sm outline-none';
const inputStyle = {
  backgroundColor: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
};

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** Ordena los items por fase (calentamiento → normal → enfriamiento). */
function ordenarPorFase(items: RutinaItem[]): RutinaItem[] {
  return [...items].sort((a, b) => ORDEN_FASE[a.fase] - ORDEN_FASE[b.fase]);
}

export default function RoutineForm({ initial }: { initial?: Rutina }) {
  const router = useRouter();
  const editing = !!initial;

  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [items, setItems] = useState<RutinaItem[]>(initial?.items ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Panel para agregar un video
  const [tab, setTab] = useState<Tab>('link');
  const [nombre, setNombre] = useState('');
  const [fase, setFase] = useState<Fase>('Normal');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [nombreTouched, setNombreTouched] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fetchedThumb, setFetchedThumb] = useState<string | null>(null);
  const [fetchedProvider, setFetchedProvider] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [itemError, setItemError] = useState('');

  // Importa título + miniatura al pegar un enlace válido.
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
        if (j.title && !nombreTouched) setNombre(j.title.slice(0, 120));
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

  function resetItemForm() {
    setNombre('');
    setUrl('');
    setFile(null);
    setNombreTouched(false);
    setFetchedThumb(null);
    setFetchedProvider(null);
    setProgress(0);
    setItemError('');
    setFase('Normal');
  }

  async function handleAddItem() {
    setItemError('');
    if (!nombre.trim()) { setItemError('Ponle un nombre al ejercicio.'); return; }

    if (tab === 'link' && !isValidVideoLink(url)) {
      setItemError('Pega un enlace válido de YouTube, Vimeo o Instagram.');
      return;
    }
    if (tab === 'upload' && !file) { setItemError('Selecciona un archivo de video.'); return; }

    setAdding(true);
    try {
      let videoUrl = url.trim();
      let miniatura: string | undefined = fetchedThumb ?? undefined;
      if (tab === 'upload' && file) {
        videoUrl = await uploadVideo(file, setProgress);
        miniatura = undefined;
      }
      const item: RutinaItem = {
        id: uid(),
        nombre: nombre.trim(),
        fase,
        tipo: tab,
        url: videoUrl,
        ...(miniatura ? { miniatura } : {}),
      };
      setItems((prev) => [...prev, item]);
      resetItemForm();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setItemError(`Error al subir: ${msg}`);
    } finally {
      setAdding(false);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function patchItem(id: string, patch: Partial<RutinaItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function handleSave() {
    setError('');
    if (!titulo.trim()) { setError('Ponle un título a la rutina.'); return; }
    if (items.length === 0) { setError('Agrega al menos un video.'); return; }

    setSaving(true);
    try {
      const payload = { titulo: titulo.trim(), items: ordenarPorFase(items) };
      if (editing && initial) await updateRutina(initial.id, payload);
      else await addRutina(payload);
      setSuccess(true);
      setTimeout(() => router.push('/library'), 1200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Error al guardar: ${msg}`);
      setSaving(false);
    }
  }

  const ordenados = ordenarPorFase(items);

  return (
    <div className="space-y-6">
      {/* Título de la rutina */}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Nombre de la rutina *
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="ej. Ejercicios kine"
          className={inputClass}
          style={inputStyle}
        />
      </div>

      {/* Lista de videos agregados */}
      {ordenados.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            {items.length} video{items.length !== 1 ? 's' : ''}
          </p>
          {ordenados.map((it, idx) => (
            <div
              key={it.id}
              className="rounded-xl p-2 flex gap-3"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div
                className="relative flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ width: 70, height: 56, backgroundColor: 'var(--color-border)' }}
              >
                {it.miniatura ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.miniatura} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg opacity-40">▶</span>
                )}
                <span
                  className="absolute top-0.5 left-0.5 text-[9px] px-1 rounded text-white font-medium"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  value={it.nombre}
                  onChange={(e) => patchItem(it.id, { nombre: e.target.value })}
                  className="w-full text-sm bg-transparent outline-none font-medium"
                  style={{ color: 'var(--color-text)' }}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={it.fase}
                    onChange={(e) => patchItem(it.id, { fase: e.target.value as Fase })}
                    className="text-xs rounded-md px-2 py-1 outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: FASE_COLOR[it.fase] }}
                  >
                    {FASES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="ml-auto text-xs px-2 py-1"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel: agregar un video */}
      <div
        className="rounded-2xl p-4 space-y-4"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px dashed var(--color-border)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          + Agregar video a la rutina
        </p>

        {/* Tab link / upload */}
        <div className="flex rounded-xl p-1" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          {(['link', 'upload'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
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

        {/* Fuente */}
        {tab === 'link' ? (
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube, Vimeo o Instagram"
              className={inputClass}
              style={inputStyle}
            />
            {importing && (
              <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-50" />
                Importando…
              </div>
            )}
            {!importing && fetchedProvider && (
              <div className="flex items-center gap-2 mt-2">
                {fetchedThumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fetchedThumb} alt="" className="w-16 h-10 object-cover rounded" />
                )}
                <span className="text-[11px]" style={{ color: 'var(--color-accent)' }}>
                  ✓ {PROVIDER_LABEL[fetchedProvider] ?? 'Video'} detectado
                </span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={inputClass}
              style={{ ...inputStyle, paddingTop: '10px' }}
            />
            {adding && progress > 0 && (
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: 'var(--color-accent)' }} />
              </div>
            )}
          </div>
        )}

        {/* Nombre + fase del item */}
        <input
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setNombreTouched(true); }}
          placeholder="Nombre del ejercicio"
          className={inputClass}
          style={inputStyle}
        />
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>Fase</label>
          <div className="flex gap-2">
            {FASES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFase(f)}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: fase === f ? FASE_COLOR[f] : 'var(--color-bg)',
                  color: fase === f ? 'white' : 'var(--color-muted)',
                  border: `1px solid ${fase === f ? FASE_COLOR[f] : 'var(--color-border)'}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {itemError && (
          <p className="text-sm" style={{ color: '#b56f54' }}>{itemError}</p>
        )}

        <button
          type="button"
          onClick={handleAddItem}
          disabled={adding}
          className="w-full py-3 rounded-xl text-sm font-medium disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
        >
          {adding ? (progress > 0 ? `Subiendo ${progress}%…` : 'Agregando…') : '+ Agregar a la rutina'}
        </button>
      </div>

      {/* Errores y guardar */}
      {error && <p className="text-sm px-1" style={{ color: '#b56f54' }}>{error}</p>}
      {success && (
        <p className="text-sm px-1" style={{ color: 'var(--color-accent)' }}>
          ✓ ¡Rutina guardada! Redirigiendo…
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 rounded-2xl text-white font-medium text-sm disabled:opacity-60"
        style={{ backgroundColor: 'var(--color-accent)' }}
      >
        {success ? '✓ ¡Guardada!' : saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear rutina'}
      </button>
    </div>
  );
}
