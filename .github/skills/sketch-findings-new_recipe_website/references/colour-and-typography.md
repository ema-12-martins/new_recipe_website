# Colour & Typography

## Design Decisions

**Direction:** warm "Papel kraft" (sketch 001, winner A). Rustic café/bakery feel with a
kraft-paper background, cream paper reading surfaces, terracotta actions and an olive
secondary accent. Chosen over a chalkboard menu (B) and a light bakery-cream look (C).

**Rule that makes it work:** texture and decoration live on the background and the edges.
Everything people read while cooking (ingredients, steps, forms) sits on plain cream paper in
a clean sans-serif. Never put recipe text directly on the textured kraft.

### Palette (shadcn tokens in `src/app/globals.css`)

| Token | Light | Dark (espresso) | Use |
|-------|-------|-----------------|-----|
| `--background` | `#c8a679` kraft | `#241b14` | Page, with `--paper-texture` |
| `--foreground` | `#3b2a1d` | `#f3e7cf` | Text on kraft |
| `--card` / `--popover` | `#fbf4e4` paper | `#33281f` | Index cards, recipe sheet, inputs, dialogs |
| `--card-foreground` | `#2e2118` | `#f3e7cf` | Text on paper |
| `--primary` | `#b5532f` terracotta | `#d97a52` | Primary button, focus ring, recipe section headings, step numbers |
| `--primary-foreground` | `#fff8ee` | `#241b14` | Text on terracotta |
| `--secondary` / `--accent` | `#f3e7cf` cream | `#3d3026` / `#43352a` | Header band, hover fills |
| `--muted` | `#eadcbf` | `#3d3026` | Placeholders |
| `--muted-foreground` | `#4f3a24` | `#cdb998` | Secondary text; must stay ≥ 4.5:1 on kraft |
| `--destructive` | `#8f2a1a` | `#f08a70` | Destructive actions and errors only |
| `--border` / `--input` | `#9c7b52` | cream 20–28% | Borders, input outlines |
| `--ring` | `#b5532f` | `#d97a52` | Focus |
| olive (chart-2) | `#6b7a3a` | `#a3b06a` | Optional secondary accent (stamps, small badges) |

Paper detail tokens: `--card-rule` (faint blue lines), `--card-rule-accent` (red rule / margin
line), `--paper-shadow`, `--paper-shadow-soft`, `--tape`, `--paper-texture`,
`--paper-texture-size`.

Dark mode follows the system setting (no toggle). Always style through tokens
(`bg-card`, `text-primary`, `text-muted-foreground`, …), never raw hex in components.

### Typography

| Role | Font | Where |
|------|------|-------|
| Body, ingredients, steps, forms, buttons | Nunito Sans (`--font-sans`, default) | Everything you read |
| Titles | Zilla Slab 500/600/700 (`font-display`; automatic on `h1`, `h2`) | Page titles, recipe title, section headings |
| Handwritten notes | Caveat (`font-hand`) | Taglines and tiny hints only, never instructions or amounts |

Fonts are self-hosted with `next/font/google` in `src/app/[locale]/layout.tsx` (CSS variables
`--font-nunito`, `--font-zilla`, `--font-caveat` on `<html>`), so they are cached by the service
worker and work offline. Sizes in use: recipe title `text-3xl font-bold`, section headings
`text-xl font-bold text-primary`, body 16px.

## CSS Patterns

```css
/* Kraft fibre texture on the page */
body {
  background-image: var(--paper-texture);
  background-size: var(--paper-texture-size);
}
:root {
  --paper-texture:
    radial-gradient(rgba(90, 60, 30, 0.1) 1px, transparent 1.2px),
    radial-gradient(rgba(255, 245, 225, 0.1) 1px, transparent 1.2px);
  --paper-texture-size: 7px 7px, 11px 11px;
}

/* Theme fonts exposed to Tailwind (in @theme inline) */
--font-sans: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
--font-display: var(--font-zilla), Rockwell, Georgia, serif;
--font-hand: var(--font-caveat), "Segoe Print", cursive;
```

## HTML Structures

```tsx
<h1 className="text-3xl font-bold break-words">{cookbookName}</h1>
<p className="mt-1 font-hand text-xl leading-tight text-muted-foreground">{common.tagline}</p>
<h2 className="text-xl font-bold text-primary">{recipes.ingredientsHeading}</h2>
```

## What to Avoid

- Decorative display fonts for body text. Amatic SC (variant B) was too hard to read at
  arm's length; Caveat is for short notes only.
- Recipe text directly on kraft or chalkboard: always on paper (`bg-card`).
- A dark-by-default look (variant B): the cookbook is used in bright kitchens; dark is the
  system-driven alternative only.
- Raw colours in components; new screens must use the tokens so dark mode keeps working.

## Origin
Synthesized from sketch: 001 (winner A). Implemented by quick task 261023-h1n (commit 5e139fd).
Source files available in: sources/001-rustic-list-and-recipe/, sources/themes/default.css
