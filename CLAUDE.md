# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt oversigt

**Budgeto** er en mobile-first PWA til budgettering med focus på simplicitet og privathed. Bygget med Vue 3, TypeScript og Tailwind CSS. All data gemmes lokalt i localStorage - ingen server, ingen tracking.

## Vigtige kommandoer

```bash
# Development
npm run dev          # Start dev server (med --host for mobile testing)

# Testing
npm test            # Kør tests i watch mode
npm test -- --run   # Kør tests én gang
npm run test:ui     # Åbn Vitest UI

# Build
npm run build       # TypeScript check + production build
npm run preview     # Preview production build lokalt
```

## Arkitektur

### Data model & beløbshåndtering

**KRITISK:** Alle beløb gemmes internt som **heltal i øre** (`DKK_ore` type) for at undgå floating-point problemer.
- 1 kr = 100 øre
- Konvertering sker kun ved UI-grænsen via `money.ts` utilities
- `formatDKK()` konverterer øre → kroner med formattering
- `parseDKKToOre()` parser user input → øre

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

```
BaseEntry (type, kategori, beloeb_ore, note)
  ├─ FixedEntry (+ id)
  └─ VariableEntry (+ id, timestamp, geo)
```

### KPI beregninger (`App.vue`)

```typescript
// "Tilbage i måneden"
faste_indtægter - faste_udgifter - variable_udgifter + variable_indtægter

// "Brugt denne måned"
sum(variable_udgifter)
```

### Component patterns

- **BottomSheet.vue**: Base component for alle sheets, håndterer overlay + touch gestures
- **UiIcon.vue**: Wrapper for Hugeicons library - kun icons fra @hugeicons/core-free-icons må bruges
- **MoneyText.vue**: Dedicated component til DKK formattering med size variants

### Utilities

- **`date.ts`**: Timezone-aware utilities (Europe/Copenhagen), month reset logic
- **`money.ts`**: DKK formattering (øre ↔ kroner) med locale support
- **`storage.ts`**: AppState CRUD + auto-reset + locking

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

`formatDKK(ore, includeCurrency, locale)` understøtter begge locales:
- **Dansk**: `"1.234,56 kr"`
- **Engelsk**: `"DKK 1,234.56"`
- **MoneyText** component bruger automatisk aktiv locale fra i18n

### Locale persistence

- Gemt i `localStorage` som `budgeto.locale`
- Auto-detection hvis ikke sat eller hvis `'auto'` valgt
- Selector findes i SheetSettings under "Sprog" section

## Gotchas

1. **Aldrig brug floating-point for penge** - kun DKK_ore integers
2. **Timezone**: Brug altid `nowInCopenhagen()` fra date.ts, ikke `new Date()`
3. **localStorage locks**: Ved concurrent writes, brug `withLock()` wrapper
4. **Icon naming**: Tjek Hugeicons docs for korrekte icon names
5. **Auto-reset**: Ændringer i reset-logik kræver tests af `shouldResetVariable()`
6. **Kategori navne**: Brug altid `getCategoryName(kategori, t)` - aldrig direkte `kategori.navn`
7. **i18n keys**: Følg nested structure i locale files (fx `newEntry.title`, ikke `newEntryTitle`)
