const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export interface UploadResult {
  url: string;
  thumbnail?: string;
}

/** Miniatura: un frame del video (segundo 0) como JPG. */
function thumbnailFromPublicId(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0/${publicId}.jpg`;
}

/**
 * Sube un archivo de video a Cloudinary (sin servidor, unsigned upload) y
 * devuelve la URL pública y una miniatura generada automáticamente.
 */
export async function uploadVideo(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Falta configurar Cloudinary (cloud name / upload preset).'
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          onProgress?.(100);
          resolve({
            url: res.secure_url as string,
            thumbnail: res.public_id
              ? thumbnailFromPublicId(res.public_id)
              : undefined,
          });
        } catch {
          reject(new Error('Respuesta inválida de Cloudinary.'));
        }
      } else {
        let detail = '';
        try {
          detail = JSON.parse(xhr.responseText)?.error?.message ?? '';
        } catch {
          /* noop */
        }
        reject(
          new Error(
            `Error al subir (${xhr.status})${detail ? `: ${detail}` : ''}`
          )
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error('No se pudo conectar con el servidor de subida.'));
    xhr.ontimeout = () => reject(new Error('La subida tardó demasiado.'));

    xhr.send(form);
  });
}
