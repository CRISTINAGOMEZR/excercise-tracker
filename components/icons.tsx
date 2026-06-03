/**
 * Sistema de iconos de la app — Carbon Design System.
 * https://carbondesignsystem.com/elements/icons/library/
 *
 * Toda la app importa sus iconos SOLO desde este archivo. Para cambiar la
 * librería de iconos en el futuro, basta con reasignar los alias de abajo.
 *
 * Uso:  <IconBack size={20} />   (heredan el color con `currentColor`).
 */
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Checkmark,
  Close,
  Add,
  Edit,
  TrashCan,
  Catalog,
  ChartColumn,
  Calendar,
  Activity,
  Maximize,
  VolumeMute,
  VolumeUp,
  Fire,
  Trophy,
  PlayFilledAlt,
  CircleDash,
  Video,
  Download,
  Notification,
  NotificationOff,
} from '@carbon/icons-react';

// Navegación / acciones generales
export const IconBack = ArrowLeft;
export const IconNext = ArrowRight;
export const IconDown = ArrowDown;
export const IconCheck = Checkmark;
export const IconClose = Close;
export const IconAdd = Add;
export const IconEdit = Edit;
export const IconDelete = TrashCan;

// Navegación inferior / secciones
export const IconToday = Calendar;
export const IconLibrary = Catalog;
export const IconStats = ChartColumn;
export const IconBrand = Activity;

// Reproductor guiado
export const IconPlay = PlayFilledAlt;
export const IconMute = VolumeMute;
export const IconUnmute = VolumeUp;
export const IconFullscreen = Maximize;
export const IconTrophy = Trophy;

// Indicadores varios
export const IconFire = Fire;
export const IconCircle = CircleDash;
export const IconVideo = Video;
export const IconInstall = Download;
export const IconBell = Notification;
export const IconBellOff = NotificationOff;
