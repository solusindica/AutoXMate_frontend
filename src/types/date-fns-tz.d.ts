// src/types/date-fns-tz.d.ts
declare module 'date-fns-tz' {
  export function utcToZonedTime(date: Date | number | string, timeZone: string): Date;
  export function format(date: Date | number, formatString: string, options?: { timeZone?: string }): string;
}


