/**
 * Budgeto Type Definitions
 * Alle beløb gemmes internt som heltal i minor units (øre, cents, osv.) for at undgå float-problemer
 */

// Legacy type - bevares for backward compatibility
export type DKK_ore = number;

// Understøttede valutaer
export type Currency = 'DKK' | 'EUR' | 'USD' | 'GBP' | 'SEK' | 'NOK';

// Money type - beløb med valuta
export interface Money {
  amount: number; // Beløb i minor units (øre, cents, osv.)
  currency: Currency;
}

export type EntryType = 'indtægt' | 'udgift';

export interface BaseEntry {
  type: EntryType;
  kategoriId: string;
  underkategoriId?: string;
  beloeb_ore: DKK_ore; // Deprecated: Kun for backward compatibility (v1)
  beloeb?: Money; // Nyt felt fra v2
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
  defaultCurrency?: Currency; // Tilføjet i v2
}
