'use client';

import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';
import { getApps, getApp } from 'firebase/app';
import { guardarTokenFCM } from './firestore';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let messaging: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!(await isSupported())) return null;
  if (!messaging) {
    const app = getApps().length ? getApp() : null;
    if (!app) return null;
    messaging = getMessaging(app);
  }
  return messaging;
}

/** ¿El navegador soporta notificaciones push? */
export async function notificacionesSoportadas(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  return isSupported();
}

/** Estado actual del permiso: 'granted' | 'denied' | 'default'. */
export function permisoActual(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Pide permiso, obtiene el token FCM del dispositivo y lo guarda en Firestore.
 * Devuelve el token, o null si el usuario lo rechazó o no es compatible.
 */
export async function activarNotificaciones(): Promise<string | null> {
  if (!VAPID_KEY) {
    throw new Error('Falta NEXT_PUBLIC_FIREBASE_VAPID_KEY');
  }
  const m = await getMessagingInstance();
  if (!m) return null;

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return null;

  // Asegura que el SW de FCM esté registrado.
  const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

  const token = await getToken(m, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });

  if (token) await guardarTokenFCM(token);
  return token;
}
