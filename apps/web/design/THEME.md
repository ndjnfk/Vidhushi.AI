# Vidushi Ji — Celestial theme

The reference design is a dark "celestial" astrology theme (see `reference/home-desktop.png` and `reference/home-mobile.png`). Build every new page in this style.

## Tokens (defined in `app/globals.css` → `@theme`)

| Token | Value | Use |
|---|---|---|
| `ink` | `#0b0809` | Page / header background |
| `ink-soft` | `#151012` | Raised panels, cards |
| `line` | `#2b2427` | Hairline borders and dividers |
| `gold` | `#c7a17a` | Headings, ornaments, accents |
| `gold-deep` | `#a8845f` | Ornaments on white buttons |
| `cream` | `#efe8e1` | Body text on dark backgrounds |

| Font class | Font | Use |
|---|---|---|
| `font-logo` | Italiana | "VIDUSHI JI" wordmark |
| `font-display` | Marcellus | Headings: uppercase, `tracking-[0.04em]`, gold |
| `font-body` | Mulish | Body text; nav and buttons in 800 weight, uppercase, `tracking-[0.12–0.16em]`, 13px |
| `font-script` | Great Vibes | Signature accents |

## Patterns

- **Ornament:** a four-point star (`components/Sparkle.tsx`) before nav items, inside buttons and next to the logo.
- **Icon buttons:** round, 60px, with a dashed `cream/35` border that turns gold on hover.
- **Buttons:** the primary button is solid white with ink text; the secondary button has a `cream/40` outline. Both use square corners.
- **Starfield:** place `<Starfield />` (`components/Starfield.tsx`) inside any `relative` dark panel. It draws smoky nebula, dense faint stars and a few bright spiked stars on a canvas. The lighter `.starfield` CSS class is still available. `animate-float` makes floating objects drift.
- **Moons:** `<Planet />` (`components/Planet.tsx`) draws a 3D moon lit from the upper left, in two variants: `copper` for the large one and `grey` for small accents.
- **Hero:** split into two columns, with a hairline `border-line` between them. The left column holds the starfield, an arch portrait, a slowly turning gold zodiac wheel (`components/ZodiacWheel.tsx`) and moons. The right column holds the gold heading, body text and CTAs.
- **Mobile:** the header shows only the logo and the menu (sparkle) button. The drawer holds all links, log in/out and the language picker.
