# Ideas for Later

These were in sketch 001 but are **not built and not decided**. Treat them as candidate ideas,
not rules. Each needs its own requirement or plan before implementation.

## Design Decisions (pending)

| Idea | What the sketch showed | Notes before building |
|------|------------------------|-----------------------|
| Tick off ingredients | Checkbox per ingredient (`accent-color: var(--primary)`); ticked lines get struck through and muted | Per-device, not saved to the database; must not change stored recipe text (D-11) |
| Current step | Tap a step to highlight it (tinted terracotta background, left bar, handwritten "a fazer agora") | Same per-device scope as ticking |
| Search | Field "Procurar por nome ou ingrediente…" filtering by title and ingredient, accent-insensitive | Search is a later roadmap concern; use PostgreSQL full-text + `pg_trgm` per the stack research, not client-side filtering |
| Side-by-side on wide screens | List on the left, open recipe on the right, from ~860px wide | Needs a routing/layout change (list and recipe are separate routes today) |
| Counts on cards | "7 ingredientes · 5 passos · 📷 2" under each title | The list query returns only id + title; needs a query change |
| "Com fotos" stamp | Small olive stamp next to the recipe meta | Olive accent token already exists |

## CSS Patterns

```css
.ings input { width: 22px; height: 22px; accent-color: var(--primary); }
.ings li.done span { text-decoration: line-through; color: var(--muted-foreground); }
.steps li.cur {
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  box-shadow: inset 4px 0 0 var(--primary);
}
```

## HTML Structures

See `sources/001-rustic-list-and-recipe/index.html` (`detailHtml()` and `listHtml()`).

## What to Avoid

- Persisting ticks or the current step as recipe data.
- Shipping client-side-only search that cannot scale or work across devices.

## Origin
Synthesized from sketch: 001 (sketch-only interactions, not part of the winning decision).
