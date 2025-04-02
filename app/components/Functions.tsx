import createApp from '@shopify/app-bridge';
import { Redirect, Modal, Fullscreen } from "@shopify/app-bridge/actions";
import {
  Icon,
  Tooltip,
} from "@shopify/polaris";
import {
  QuestionCircleIcon,
} from '@shopify/polaris-icons';

export const getRedirect = (shopify) => {
  const app = createApp({
    apiKey: shopify.config.apiKey,
    host: shopify.config.host,
    forceRedirect: true,
  });
  const redirect = Redirect.create(app);
  return redirect;
}

export const getFullscreen = (shopify):Fullscreen.Fullscreen => {
  const app = createApp({
    apiKey: shopify.config.apiKey,
    host: shopify.config.host,
    forceRedirect: true,
  });
  const fullscreen = Fullscreen.create(app);
  return fullscreen;
}
export const enterFullscreen = (fullscreen:Fullscreen.Fullscreen) => {
  fullscreen && fullscreen.dispatch(Fullscreen.Action.ENTER);
}
export const exitFullscreen = (fullscreen:Fullscreen.Fullscreen) => {
  fullscreen && fullscreen.dispatch(Fullscreen.Action.EXIT);
}
export const makeFullscreen = (shopify) => {
  const fullscreen:Fullscreen.Fullscreen = getFullscreen(shopify);
  fullscreen.dispatch(Fullscreen.Action.ENTER);
  return fullscreen;
}

export const getDateBy = (offset?: string|number|undefined) : Date|any => {
  const type = typeof offset;
  if (['string', 'number', 'undefined'].indexOf(type) === -1) return offset;
  if (typeof offset == 'string') return new Date(offset);
  if (typeof offset == 'string') return new Date(offset);
  let date = new Date();
  if (!offset) return date;
  date.setDate(date.getDate() + offset);
  return date;
}

export const formateDate = (date: string|Date, style: number) : string => {
  if (typeof date == 'string') date = new Date(date);
  switch (style) {
    default:
      return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
      break;
  }
}

export function formatTime(timeString: string) {
  const [hourString, minute] = timeString.split(":");
  const hour = +hourString % 24;
  return (hour % 12 || 12) + ":" + minute + (hour < 12 ? "AM" : "PM");
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const isArrayIncluded = (arr:[], target:[]) => target.every(v => arr.includes(v));
export const isArrayHasAny = (arr:[], target:[]) => target.some(v => arr.includes(v));

export const tooltip = (tip: string) => {
  return <Tooltip content={tip}><Icon source={QuestionCircleIcon} /></Tooltip>
}

export const makeReadable = (text:string) => {
  return text.replaceAll('_', ' ').split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const isSaveBarOpen = (id:string = 'translation-save-bar') => {
  return document.getElementById(id)?.showing;
}


export function addSuffixToFilename(url:string, suffix:string) {
  const parts = url.split('/');
  const filename = parts.pop();
  const filenameParts = filename.split('.');
  const extension = filenameParts.pop();
  const newFilename = filenameParts.join('.') + suffix + '.' + extension;
  parts.push(newFilename);
  return parts.join('/');
}

export const fileToBase64 = (file):string => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export function getReadableDate(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  const weekDay = date.toLocaleString('en-US',{ weekday: 'short'});
  const timeLabel = date.toLocaleString('en-US',{ hour: 'numeric', minute: 'numeric', hour12:true });
  const dateLabel = date.toLocaleString('en-US',{ month: 'short', day: 'numeric'});
  
  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    // return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `today at ${timeLabel}`;
  } else if (days === 1) {
    return `yesterday at ${timeLabel}`;
  } else if (days < 7) {
    // return `${days} day${days > 1 ? 's' : ''} ago`;
    return `${weekDay} at ${timeLabel}`;
  } else if (days < 30) {
    // const weeks = Math.floor(days / 7);
    // return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return `${dateLabel} at ${timeLabel}`;
  } else if (days < 365) {
    // const months = Math.floor(days / 30);
    // return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${dateLabel} at ${timeLabel}`;
  } else {
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

export function getIDBySection(id?:string|null, section?:string) {
  let idv = '';
  if (!id) return '';

  switch (section) {
    case 'product':
      idv = `gid://shopify/Product/${id}`;
      break;
  }
  return idv;
}

export function extractId(id:string) {
  return id.split('/').pop();
}