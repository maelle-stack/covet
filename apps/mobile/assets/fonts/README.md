# fonts

Production font files, copied from `/design/fonts` (the canonical source —
edit there, then re-copy here if updated).

- **The Silver Editorial** (`TheSilverEditorial-Regular.ttf`) — the
  editorial serif for display money numbers and the COVET wordmark
  (docs/04_design_system.md `type.display.money` / `type.display.logo`).
  Only a Regular weight was provided.
- **Neue Montreal** (`NeueMontreal-*.otf`, 8 weights/styles: Regular,
  Light, Medium, Bold, and their Italics) — the sans-serif for labels,
  body text, navigation, and utility copy (`type.body` / `type.label`).

Only `.otf`/`.ttf` files are copied here — those are what Expo Font /
`expo-font` load at runtime. The `.woff`/`.woff2` variants and `style.css`
in `/design/fonts` are web-only and not needed by the native app.

Load these via `expo-font`'s `useFonts` hook at the app root before
rendering any screen that uses `type.display.money` or `type.display.logo`.
