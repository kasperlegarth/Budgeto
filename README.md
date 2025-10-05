# Budgeto

> Simpel budgettering for din daglige økonomi

En mobil-first PWA til at holde styr på indtægter og udgifter pr. måned. Alt gemmes lokalt på din enhed.

## ✨ Features

- 📱 **Mobile-first PWA** - Installer som app på iOS/Android
- 🔒 **100% Offline** - Al data gemmes i localStorage
- 💰 **KPI Dashboard** - "Tilbage i måneden" + "Brugt denne måned"
- 📊 **Kategorier** - 8 foruddefinerede kategorier med underkategorier
- 🔄 **Auto-reset** - Variable posteringer nulstilles automatisk d. 1 hver måned
- 🎨 **Dark mode** - Automatisk støtte baseret på system preference
- ♿ **Accessible** - Følger WCAG retningslinjer

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## 🏗️ Tech Stack

- **Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Build:** Vite
- **PWA:** vite-plugin-pwa (Workbox)
- **Icons:** Hugeicons (inline SVG)
- **Testing:** Vitest

## 📁 Project Structure

```
src/
├── brand/              # Logo & branding assets
├── components/         # Vue components
│   ├── BottomSheet.vue
│   ├── EmptyState.vue
│   ├── FabMenu.vue
│   ├── MoneyText.vue
│   ├── Onboarding.vue
│   ├── SheetNewEntry.vue
│   ├── SheetFixedEntries.vue
│   ├── SheetSettings.vue
│   └── UiIcon.vue
├── data/               # Seed data
│   └── categories.seed.json
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Helper functions
│   ├── date.ts         # Date/timezone utils
│   ├── money.ts        # DKK formatting & parsing
│   └── storage.ts      # localStorage operations
├── App.vue             # Main app component
├── main.ts             # Entry point
└── style.css           # Global styles & tokens

public/
├── icons/              # PWA icons (192, 512, maskable)
├── favicon.svg
└── apple-touch-icon.png
```

## 💡 How It Works

### Data Model

All amounts are stored as **integers in øre** (1 kr = 100 øre) to avoid floating-point issues.

```typescript
type DKK_ore = number;

interface VariableEntry {
  id: string;
  type: 'indtægt' | 'udgift';
  kategoriId: string;
  underkategoriId?: string;
  beloeb_ore: DKK_ore;
  note?: string;
  timestamp: number;
  geo?: { lat: number; lng: number } | null;
}
```

### KPI Calculations

**Tilbage i måneden:**
```
faste indtægter - faste udgifter - variable udgifter + variable indtægter
```

**Brugt denne måned:**
```
sum(variable udgifter)
```

### Auto-Reset Logic

- Checks `lastOpenedISO` on every app open
- If new month detected (in Europe/Copenhagen timezone):
  - Clears all `variable` entries
  - Updates `sidsteResetISO` to first day of current month
- Fixed entries persist across months

## 🎨 Design Tokens

```css
/* Colors (Light Mode) */
--color-primary: #2A6C4F
--color-accent: #FFBE5B
--color-negative: #E74C3C

/* Colors (Dark Mode) */
--color-primary-dark: #4AC28B
--color-accent-dark: #FFD37E
--color-negative-dark: #FF7063
```

## 🧪 Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run
```

Tests cover:
- Money formatting & parsing (DKK)
- Date utilities
- Storage operations

## 📦 Build & Deploy

```bash
# Build optimized production bundle
npm run build

# Preview locally
npm run preview
```

The build outputs to `dist/` and includes:
- Minified JS/CSS
- Service worker for offline caching
- PWA manifest
- Optimized assets

### Deployment

Deploy `dist/` folder to any static host:
- **Vercel:** `vercel --prod`
- **Netlify:** Drag & drop `dist/`
- **GitHub Pages:** Push to `gh-pages` branch

## 🔐 Privacy

- **No server** - Everything runs in your browser
- **No tracking** - Zero analytics or external requests
- **No accounts** - No login required
- **Your data stays local** - Uses localStorage only

## 📄 License

MIT

---

**Budgeto** — Holde styr på din økonomi på den nemme måde 💚
