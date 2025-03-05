import createApp from '@shopify/app-bridge';
import { Redirect } from "@shopify/app-bridge/actions";

export const getRedirect = (shopify) => {
  const app = createApp({
    apiKey: shopify.config.apiKey,
    host: shopify.config.host,
    forceRedirect: true,
  });
  const redirect = Redirect.create(app);
  return redirect;
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