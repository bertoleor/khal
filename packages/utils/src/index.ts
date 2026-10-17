export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}

export * from './dates';
export * from './formatTimeEsAR';
export * from './links';
export * from './mercadopagoMock';
export * from './money';
export * from './reminder';
