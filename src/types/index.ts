/**
 * Budgeto Type Definitions
 * Alle beløb gemmes internt som heltal i øre for at undgå float-problemer
 */

export type DKK_ore = number;
export type EntryType = 'indtægt' | 'udgift';

export interface BaseEntry {
  type: EntryType;
  kategoriId: string;
  underkategoriId?: string;
  beloeb_ore: DKK_ore;
  note?: string;
}

export interface FixedEntry extends BaseEntry {
  id: string;
}

export interface VariableEntry extends BaseEntry {
  id: string;
  timestamp: number;
  geo?: { lat: number; lng: number } | null;
}

export interface Subcategory {
  id: string;
  navn?: string; // Deprecated: Kun for backward compatibility
  nameKey?: string; // Translation key (fx "categories.dagligvarer")
  icon?: string;
}

export interface Category {
  id: string;
  navn?: string; // Deprecated: Kun for backward compatibility
  nameKey?: string; // Translation key (fx "categories.mad")
  icon: string;
  color?: string;
  underkategorier?: Subcategory[];
}

export interface AppState {
  version: number;
  faste: FixedEntry[];
  variable: VariableEntry[];
  kategorier: Category[];
  sidsteResetISO: string | null;
}
