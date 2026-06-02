import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// El service account llega como JSON en una sola variable de entorno (sensible).
function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Falta FIREBASE_SERVICE_ACCOUNT');
  const json = JSON.parse(raw);
  // Las claves privadas a veces traen los saltos de línea escapados.
  if (json.private_key) json.private_key = json.private_key.replace(/\\n/g, '\n');
  return json;
}

function getAdminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({ credential: cert(getServiceAccount()) });
}

// Inicialización perezosa: nada se ejecuta al importar (así el build no necesita
// el service account). Solo se inicializa cuando la API route lo usa.
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}
