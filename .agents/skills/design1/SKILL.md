Lightweight design skill for Arzac Studio projects. Diagnose UI bugs, build features, review design quality.

## Register

This project is **product** register (admin dashboard + client-facing SaaS templates). Design serves the product.

## Core design rules

### Color
- Use OKLCH. Reduce chroma near lightness extremes.
- Never use pure `#000` or `#fff` — tint neutrals toward brand hue.
- Default strategy: **Restrained** (tinted neutrals + one accent ≤10%).

### Typography
- Body line length: 65–75ch max.
- Hierarchy through scale + weight contrast (≥1.25 ratio between steps).

### Layout
- Vary spacing for rhythm — same padding everywhere is monotony.
- Cards only when truly the best affordance. No nested cards.

### Motion
- Never animate CSS layout properties.
- Ease out with exponential curves (quart/quint/expo). No bounce/elastic.

### Bans
- No side-stripe accent borders (>1px border-left/right as decoration).
- No gradient text (background-clip: text + gradient).
- No glassmorphism as default.
- No identical card grids (icon + heading + text repeated).
- No em dashes in copy.

### Product-specific
- Hierarchy: primary action obvious, secondary muted, tertiary near-invisible.
- Data density over whitespace — users are working, not browsing.
- States: every interactive element needs default, hover, active, focus, disabled, loading.
- Errors inline at the point of failure, not toasts.
- Tables over cards for tabular data. Always.

## How to use

When the user describes a UI task, bug, or design request:
1. Read the relevant source files.
2. Diagnose or plan the change, applying the rules above.
3. Implement directly — no ceremony, no PRODUCT.md loading, no context scripts.
4. Verify if a preview server is available.

Keep responses concise. Code over commentary.
