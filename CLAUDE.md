# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt oversigt

**Budgeto** er en mobile-first PWA til budgettering med focus på simplicitet og privathed. Bygget med Vue 3, TypeScript og Tailwind CSS. All data gemmes lokalt i localStorage - ingen server, ingen tracking.

## Vigtige kommandoer

```bash
# Development
npm run dev          # Start dev server (med --host for mobile testing)
npm run dev:mock     # Start dev server med mock data (virker på mobile også!)

# Testing
npm test            # Kør tests i watch mode
npm test -- --run   # Kør tests én gang
npm run test:ui     # Åbn Vitest UI

# Build
npm run build       # TypeScript check + production build
npm run preview     # Preview production build lokalt
```

### Dev Mode (Mock Data)

Dev mode populerer appen med realistic test data for udvikling. Fungerer automatisk på både desktop og mobile devices.

**Aktivering:**
```bash
npm run dev:mock
```

Dette sætter `VITE_DEV_MODE=true` environment variable, som appen automatisk detekterer. Mock data genereres ved første load.

**Dev mode indikator:**
- Lilla "Dev Mode" badge vises øverst på siden

**Mock data inkluderer:**
- 7 faste posteringer (løn, husleje, abonnementer)
- 35-45 variable posteringer spredt over måneden
- Multi-currency eksempler (DKK, EUR, USD)
- Realistic beløb og kategorier
- Noter på udvalgte posteringer

**Manuel aktivering (fallback):**
Hvis du har brug for dev mode uden npm script:
```javascript
localStorage.setItem('budgeto.devMode', 'true')
location.reload()
```

## Arkitektur

### Data model & beløbshåndtering

**KRITISK:** Alle beløb gemmes internt som **heltal i minor units** (øre, cents, osv.) for at undgå floating-point problemer.

#### Multi-currency support (v2+)

Fra version 2 understøtter appen flere valutaer via `Money` interface:
- **`Money`**: `{ amount: number, currency: Currency }`
- **`Currency`**: `'DKK' | 'EUR' | 'USD' | 'GBP' | 'SEK' | 'NOK'`
- Alle entries har både `beloeb_ore` (legacy) og `beloeb` (Money objekt)
- `defaultCurrency` i AppState bestemmer standard valuta

#### Money utilities (`money.ts`)

Nye generiske funktioner:
- `formatMoney(money, includeCurrency?, locale?)` - formaterer Money objekter
- `parseMoney(input, currency)` - parser input til Money objekt
- `toMinorUnits(amount, currency)` - konverterer til minor units (øre, cents)
- `toMajorUnits(amount, currency)` - konverterer til major units (kroner, euros)
- `convertCurrency(money, targetCurrency)` - konverterer mellem valutaer
- `getCurrencyInfo(currency)` - henter metadata (symbol, decimal separator, osv.)
- `getExchangeRate(from, to)` - henter exchange rate

Legacy funktioner bevaret:
- `formatDKK(ore, includeCurrency?, locale?)` - formaterer DKK
- `parseDKK(input)` - parser DKK input til øre
- `kronerTilOre(kroner)` - konverterer kroner til øre
- `oreTilKroner(ore)` - konverterer øre til kroner

### State management

App state håndteres via localStorage uden external state management libraries:
- **`storage.ts`**: Core localStorage operations, auto-reset logic, locking mechanism
- **`initAppState()`**: Initialiserer app ved load, håndterer månedsskifte auto-reset
- **`withLock()`**: Wrapper for concurrent write-safety

### Auto-reset flow (se `storage.ts` og `date.ts`)

1. Ved hver app-open tjekkes `lastOpenedISO` mod nuværende dato (Europe/Copenhagen timezone)
2. Hvis ny måned detekteret:
   - `variable` entries slettes
   - `sidsteResetISO` opdateres til første dag i måneden
   - `faste` entries bevares
3. Logik findes i `shouldResetVariable()` - sammenligner ISO strings fra `firstDayOfMonth()`

### Type hierarki (`src/types/index.ts`)

```typescript
// Currency types (v2+)
type Currency = 'DKK' | 'EUR' | 'USD' | 'GBP' | 'SEK' | 'NOK';
interface Money {
  amount: number;      // Beløb i minor units (øre, cents, osv.)
  currency: Currency;
}

// Entry types
BaseEntry (type, kategori, beloeb_ore, beloeb, note)
  ├─ FixedEntry (+ id)
  └─ VariableEntry (+ id, timestamp, geo)

// AppState
AppState {
  version: number;
  defaultCurrency?: Currency;  // v2+
  faste: FixedEntry[];
  variable: VariableEntry[];
  kategorier: Category[];
  sidsteResetISO: string | null;
}
```

### KPI beregninger (`App.vue`)

```typescript
// "Tilbage i måneden"
faste_indtægter - faste_udgifter - variable_udgifter + variable_indtægter

// "Brugt denne måned"
sum(variable_udgifter)

// VIGTIGT: Brug fallback for v1/v2 compatibility
entry.beloeb?.amount ?? entry.beloeb_ore
```

### Component patterns

- **BottomSheet.vue**: Base component for alle sheets, håndterer overlay + touch gestures
- **UiIcon.vue**: Wrapper for Hugeicons library - kun icons fra @hugeicons/core-free-icons må bruges
- **MoneyText.vue**: Dedicated component til money formattering med size variants
  - Understøtter både Money objekter (`money` prop) og legacy DKK_ore (`amount` prop)
  - Auto-detekterer aktiv currency fra `useCurrency()`
  - Bruger locale fra i18n til formattering

### Utilities

- **`date.ts`**: Timezone-aware utilities (Europe/Copenhagen), month reset logic
- **`money.ts`**: Multi-currency formattering og conversion med locale support
  - Currency info database med metadata for hver valuta
  - Fixed exchange rates (DKK som base) - klar til live rates
  - Legacy DKK funktioner bevaret for backward compatibility
- **`storage.ts`**: AppState CRUD + auto-reset + locking + migration V1→V2

### Composables

- **`useTheme.ts`**: Theme management (light/dark/auto)
- **`useLocale.ts`**: Language switching (da/en/auto)
- **`useCurrency.ts`**: Currency management
  - `currentCurrency` - aktiv valuta
  - `setCurrency(currency)` - skift valuta
  - `supportedCurrencies` - liste af understøttede valutaer med metadata

### Theme system (`useTheme.ts`)

Global composable med 3 modes: `light`, `dark`, `auto`
- Persisted til localStorage
- `auto` følger system preference via `prefers-color-scheme`
- Tailwind's `darkMode: 'class'` bruges

### Testing

Vitest config i `vitest.config.ts` med jsdom environment.
Tests fokuserer på:
- Money utilities (formatering, parsing)
- Date utilities (timezone, month boundaries)
- Storage operations

### Icons

Projektet bruger **Hugeicons** library:
- Import kun fra `@hugeicons/vue` eller `@hugeicons/core-free-icons`
- Icon names skal matche Hugeicons naming (kebab-case)
- Brug `UiIcon` component i stedet for direkte imports

### PWA

- `vite-plugin-pwa` med Workbox
- Manifest i `public/manifest.json`
- Icons: 192x192, 512x512 + maskable variants
- Offline-first caching strategy

## Code style

- **Sprog**: Kode og kommentarer på dansk (variable names, comments, log messages)
- **Vue**: Composition API med `<script setup>` syntax
- **Formatting**: Prettier + prettier-plugin-tailwindcss (auto-sorterer utility classes)
- **TypeScript**: Strict mode enabled via tsconfig

## Internationalisering (i18n)

App'en understøtter dansk og engelsk via **vue-i18n**.

### Setup

- **Locales**: `src/locales/da.json` og `src/locales/en.json`
- **Config**: `main.ts` initialiserer i18n med auto-detection
- **Composable**: `useLocale()` håndterer locale switching + localStorage persistence
- **Modes**: `'da'`, `'en'`, `'auto'` (browser detection via `navigator.language`)

### Brug i komponenter

```typescript
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// I template
{{ t('common.save') }}
{{ t('categories.mad') }}
```

### Kategori translations

Kategorier bruger `nameKey` felt i stedet for `navn`:
- **Seed data**: `categories.seed.json` har `nameKey: "categories.mad"`
- **Migration**: `storage.ts` migrerer automatisk gamle `navn` → `nameKey`
- **Helper**: `getCategoryName(kategori, t)` returnerer translated navn
- **Fallback**: Hvis `nameKey` mangler, bruges `navn` felt (backward compatibility)

### Money formattering

`formatMoney(money, includeCurrency, locale)` formaterer baseret på currency:
- **DKK/SEK/NOK**: `"1.234,56 kr"` (dansk) eller `"DKK 1,234.56"` (engelsk)
- **EUR**: `"€1.234,56"` (dansk) eller `"€1,234.56"` (engelsk)
- **USD/GBP**: `"$1,234.56"` eller `"£1,234.56"`
- **MoneyText** component bruger automatisk aktiv locale fra i18n

Legacy `formatDKK(ore, includeCurrency, locale)` virker stadig:
- **Dansk**: `"1.234,56 kr"`
- **Engelsk**: `"DKK 1,234.56"`

### Persistence

- **Locale**: `localStorage` som `budgeto.locale` (da/en/auto)
- **Currency**: Gemt i AppState som `defaultCurrency`
- **Selectors**: Begge findes i SheetSettings (Sprog + Valuta sections)

## Gotchas

1. **Aldrig brug floating-point for penge** - kun integers i minor units
2. **Money vs. beloeb_ore**: Nye entries skal bruge både `beloeb` (Money) og `beloeb_ore` (legacy) for backward compatibility
3. **KPI beregninger**: Brug `entry.beloeb?.amount ?? entry.beloeb_ore` for at understøtte både v1 og v2 data
4. **Timezone**: Brug altid `nowInCopenhagen()` fra date.ts, ikke `new Date()`
5. **localStorage locks**: Ved concurrent writes, brug `withLock()` wrapper
6. **Icon naming**: Tjek Hugeicons docs for korrekte icon names
7. **Auto-reset**: Ændringer i reset-logik kræver tests af `shouldResetVariable()`
8. **Kategori navne**: Brug altid `getCategoryName(kategori, t)` - aldrig direkte `kategori.navn`
9. **i18n keys**: Følg nested structure i locale files (fx `newEntry.title`, ikke `newEntryTitle`)
10. **Currency conversion**: Fixed rates bruges indtil live rates implementeres - se `FIXED_EXCHANGE_RATES` i money.ts

## Versioning & Migration

### Version 2 (Multi-currency support)

Migration fra v1 til v2 sker automatisk ved `initAppState()`:
- Alle `beloeb_ore` felter konverteres til `Money` objekter med `currency: 'DKK'`
- `defaultCurrency: 'DKK'` tilføjes til AppState
- Ingen data går tabt - backward compatibility bevares

**Exchange rates (fixed):**
- EUR: 7.46 DKK/EUR
- USD: 6.90 DKK/USD
- GBP: 8.70 DKK/GBP
- SEK: 0.66 DKK/SEK
- NOK: 0.65 DKK/NOK

**Fremtidig udvidelse:**
- Live exchange rates kan implementeres ved at erstatte `FIXED_EXCHANGE_RATES` med API calls
- Rate caching kan tilføjes i localStorage for offline support
- Multi-currency per entry kan aktiveres ved at tillade forskellige valutaer i samme budget
