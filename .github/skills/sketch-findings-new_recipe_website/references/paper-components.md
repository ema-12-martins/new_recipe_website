# Paper Components

## Design Decisions

Shared component classes live in `@layer components` in `src/app/globals.css`, so every screen
reuses the same paper vocabulary instead of re-inventing it.

| Class | Looks like | Used for |
|-------|-----------|----------|
| `paper-label` | Full-width cream band with a pinking-shears (zigzag) bottom edge | App header (`src/components/app-header.tsx`) |
| `index-card` + `index-card-title` | Cream card, title above a red rule, faint blue lines below, tilted ±0.3°, lifts on hover | Recipe list items |
| `recipe-sheet` | Notebook page with a red margin line, a strip of tape at the top, deep shadow | The recipe page body |
| `recipe-ingredients` | Ingredient lines separated by dashed red rules | Ingredient `<ul>` |
| `recipe-steps` | Steps with numbered terracotta circles (CSS counters) | Step `<ol>` |
| `polaroid` | White frame with a deeper bottom, tilted ±2° | Photos of the original handwritten recipe |

Other decisions:
- Inputs and textareas use `bg-card` (paper) so forms read on kraft; outline buttons use
  `bg-card/70`.
- Touch targets stay at least 44px (`h-11`, `size-11`).
- Lists that drop native bullets get `role="list"` so Safari/VoiceOver keeps list semantics.
- Recipe text is still rendered exactly as stored (D-11): keep `whitespace-pre-wrap` and
  `break-words` on titles, ingredients and steps.
- Motion is limited to hover lift and tilt; `prefers-reduced-motion` removes transitions.

## CSS Patterns

```css
/* Pinking-shears edge under the cream header band */
.paper-label::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -10px; height: 10px;
  background:
    linear-gradient(135deg, var(--secondary) 25%, transparent 25%) -5px 0 / 20px 20px repeat-x,
    linear-gradient(225deg, var(--secondary) 25%, transparent 25%) -5px 0 / 20px 20px repeat-x;
}

/* Index card: faint ruled lines; the title strip covers them and carries the red rule */
.index-card {
  background-color: var(--card);
  background-image: repeating-linear-gradient(to bottom, transparent 0 21px, var(--card-rule) 21px 22px);
  box-shadow: 0 2px 0 var(--paper-shadow), 0 6px 14px var(--paper-shadow-soft);
}
.index-card-title { border-bottom: 1.5px solid var(--card-rule-accent); background-color: var(--card); }
li:nth-child(odd) > .index-card { transform: rotate(-0.35deg); }
li:nth-child(even) > .index-card { transform: rotate(0.3deg); }

/* Recipe sheet: red margin line + tape */
.recipe-sheet {
  --margin-line: 1.9rem;
  padding-left: calc(var(--margin-line) + 1.1rem);
  background-image: linear-gradient(90deg, transparent var(--margin-line),
    var(--card-rule-accent) var(--margin-line) calc(var(--margin-line) + 1.5px),
    transparent calc(var(--margin-line) + 1.5px));
}
.recipe-sheet::before { /* tape */
  content: ""; position: absolute; top: -12px; left: 50%; width: 120px; height: 28px;
  transform: translateX(-50%) rotate(-2deg); background: var(--tape);
}

/* Numbered terracotta steps */
.recipe-steps { counter-reset: step; }
.recipe-steps > li { counter-increment: step; position: relative; padding-left: 2.75rem; }
.recipe-steps > li::before {
  content: counter(step); position: absolute; left: 0; width: 1.875rem; height: 1.875rem;
  display: grid; place-items: center; border-radius: 9999px;
  background: var(--primary); color: var(--primary-foreground); font-weight: 700;
}
```

## HTML Structures

```tsx
// Full-bleed header band inside the centred page container; it only tucks under the
// container's top padding when no offline notice renders above it.
<header className="paper-label mx-[calc(50%-50vw)] mb-10 first:-mt-6">
  <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2 sm:px-6">…</div>
</header>

// Recipe list
<ul role="list" className="space-y-3">
  <li><Link href={…} className="index-card"><span className="index-card-title break-words">{title}</span></Link></li>
</ul>

// Recipe page
<div className="recipe-sheet space-y-6">
  <h1 className="text-3xl font-bold break-words whitespace-pre-wrap">{title}</h1>
  <ul role="list" className="recipe-ingredients">…</ul>
  <ol role="list" className="recipe-steps space-y-4">…</ol>
</div>

// Photo thumbnails
<button className="polaroid block w-full …"><img className="aspect-[3/4] w-full object-cover" … /></button>
```

`body` has `overflow-x: clip` so the full-bleed band never causes sideways scrolling.

## What to Avoid

- Plain bordered `divide-y` lists and default bullets/numbers on recipe screens: they read
  as the old neutral theme.
- Heavy decoration inside the reading area (tape, pins or doodles over text).
- Big rotations: keep tilt within ±0.35° for cards and ±2° for photos so text stays crisp.
- Chalkboard menu rows with dotted leaders (variant B) and initial-letter "plate" tiles
  (variant C): rejected; plates waste space when a recipe has no photo.

## Origin
Synthesized from sketch: 001 (winner A). Implemented by quick task 261023-h1n (commit 5e139fd).
Source files available in: sources/001-rustic-list-and-recipe/
