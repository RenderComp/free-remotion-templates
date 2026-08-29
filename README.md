# 50 Free Remotion Templates

Fifty MIT-licensed [Remotion](https://www.remotion.dev/) templates from [RenderComp](https://rendercomp.com/), hand-picked from a 1,000+ template catalog. Real React components — clone, customize, and render in Remotion Studio.

No account. No email. MIT-licensed templates. Full source in this repository.

Video previews of every template: https://rendercomp.com/free

## Quick start

```bash
git clone https://github.com/RenderComp/free-remotion-templates.git
cd free-remotion-templates
npm install
npm run dev
```

`npm run dev` opens Remotion Studio at http://localhost:3000 with all 50 templates in the sidebar, grouped by category. Edit the props in the right-hand panel to make a template yours.

Render any template to MP4 by its composition ID:

```bash
npm run render -- kpi-counter out/kpi-counter.mp4
```

Requirements: a current Node.js LTS release. The first render downloads a headless browser once, so it takes a few minutes; later renders are much faster.

## What's inside

Each template is a single `.tsx` file under `src/components/<composition-id>/` with typed props and sensible defaults. The six pixel-art templates share a small helper module in `src/pixel-kit/`. Nothing else is needed: no fonts, images, or audio are bundled, and the only dependencies are `remotion` and `react`.

### Logo & Brand

| Template | Composition ID | Size | Length | What it does |
|---|---|---|---|---|
| Brush Stroke Reveal | `brush-stroke-reveal` | 1920×1080 (16:9) | 4s @ 30fps | A paint brush stroke sweeps in and carries your mark. |
| Logo Blur Reveal | `logo-blur-reveal` | 1920×1080 (16:9) | 4s @ 30fps | Logo sharpens out of a soft blur into focus. |
| Logo Bounce Drop | `logo-bounce-drop` | 1920×1080 (16:9) | 3s @ 30fps | Logo drops in and settles with a springy bounce. |
| Logo Mask Wipe | `logo-mask-wipe` | 1920×1080 (16:9) | 3.3s @ 30fps | A diagonal mask wipes across to expose the logo. |
| Logo Split Reveal | `logo-split-reveal` | 1920×1080 (16:9) | 4s @ 30fps | Two panels split apart to reveal the logo between them. |
| Logo Stroke Draw | `logo-stroke-draw` | 1920×1080 (16:9) | 3.7s @ 30fps | Traces your logo outline stroke by stroke, then fills. |
| Neon Sign Flicker | `neon-sign` | 1080×1080 (1:1) | 3.3s @ 30fps | Your text buzzes on like a neon tube, flicker and all. |
| Shatter Reveal | `shatter-reveal` | 1920×1080 (16:9) | 4s @ 30fps | The cover layer shatters into shards, revealing what's behind. |

### Text & Titles

| Template | Composition ID | Size | Length | What it does |
|---|---|---|---|---|
| Bounce-In Headline | `bounce-in-headline` | 1920×1080 (16:9) | 4s @ 30fps | The headline lands with an elastic bounce, word by word. |
| Chapter Title Card | `chapter-title` | 1920×1080 (16:9) | 5s @ 30fps | A clean numbered chapter card for section breaks. |
| Four-Tone Titler | `four-tone-mono-titler` | 1920×1080 (16:9) | 4s @ 30fps | A duotone title block that steps through four color states. |
| Glitch Text | `glitch-text` | 1920×1080 (16:9) | 4s @ 30fps | RGB-split glitches tear the title before it stabilizes. |
| Gradient Sweep Title | `gradient-text-sweep` | 1920×1080 (16:9) | 3.7s @ 30fps | A color gradient sweeps through the headline. |
| Kinetic Word Stack | `kinetic-word-stack` | 1920×1080 (16:9) | 4s @ 30fps | Words punch in and stack into a bold kinetic block. |
| Pixel Typewriter Quote | `pixel-typewriter-quote` | 1920×1080 (16:9) | 6s @ 30fps | A retro pixel-font quote typed onto the screen. |
| Scramble Text | `scramble-text` | 1920×1080 (16:9) | 5s @ 30fps | Characters cycle randomly, then lock into your headline. |
| Text Mask Reveal | `text-mask-reveal` | 1920×1080 (16:9) | 3.7s @ 30fps | Text slides up out of an invisible mask line. |
| Typewriter | `typewriter` | 1080×1080 (1:1) | 3.3s @ 30fps | Types your copy character by character, cursor included. |
| Wave Text | `wave-text` | 1920×1080 (16:9) | 5s @ 30fps | Letters ride a smooth wave, one after another. |

### Transitions

| Template | Composition ID | Size | Length | What it does |
|---|---|---|---|---|
| Camera Shake | `camera-shake` | 1920×1080 (16:9) | 4s @ 30fps | Adds handheld impact shake to any cut or hit. |
| Card Flip | `card-flip-transition` | 1920×1080 (16:9) | 4s @ 30fps | The whole frame flips over like a card to the next scene. |
| Circle Wipe | `transition-circle-wipe` | 1920×1080 (16:9) | 3s @ 30fps | A circle expands from center to swallow the scene. |
| Ink Spread | `ink-spread-transition` | 1920×1080 (16:9) | 4s @ 30fps | Ink blots spread and flood the frame into the next scene. |
| Page Flip | `flip-page-transition` | 1920×1080 (16:9) | 4s @ 30fps | A page turn carries scene A over to scene B. |
| Pixel Mosaic Transition | `pixel-mosaic-transition` | 1920×1080 (16:9) | 3s @ 30fps | The frame dissolves into pixel blocks and reassembles. |
| Slide Wipe | `slide-wipe` | 1920×1080 (16:9) | 4s @ 30fps | A clean directional slide pushes the old frame out. |
| Whip Pan | `whip-pan` | 1920×1080 (16:9) | 4s @ 30fps | A fast blurred pan whips from one scene to the next. |

### Data & Charts

| Template | Composition ID | Size | Length | What it does |
|---|---|---|---|---|
| Animated Bar Chart | `bar-chart-anim` | 1920×1080 (16:9) | 5s @ 30fps | Bars grow to your values in sequence. |
| Animated Line Chart | `line-chart-anim` | 1920×1080 (16:9) | 5s @ 30fps | A line draws itself across the axes to your data. |
| Drip Fill Gauge | `pourover-drip-fill-gauge` | 1920×1080 (16:9) | 6s @ 30fps | A gauge fills drop by drop to the target percentage. |
| KPI Counter | `kpi-counter` | 1920×1080 (16:9) | 4s @ 30fps | A number counts up to your metric with its label. |
| Pixel Candlestick | `pixel-candlestick-ohlc` | 1920×1080 (16:9) | 6s @ 30fps | A retro pixel OHLC chart plays out your price data. |
| Racing Bar Chart | `racing-chart` | 1920×1080 (16:9) | 7s @ 30fps | Ranked bars overtake each other as values change. |

### Social & UI

| Template | Composition ID | Size | Length | What it does |
|---|---|---|---|---|
| Chat Conversation | `community-chat` | 1080×1920 (9:16) | 9s @ 30fps | Message bubbles pop in like a live chat thread (9:16). |
| End Card / Outro | `end-card` | 1920×1080 (16:9) | 5s @ 30fps | A closing card with CTA slots for subscribe and links. |
| Eye Blink Reveal | `eye-reveal` | 1080×1080 (1:1) | 3s @ 30fps | An eye opens and its iris reveals your scene. |
| Glass Lower Third | `lower-third-glass-card` | 1920×1080 (16:9) | 4s @ 30fps | A frosted-glass name plate slides in from the corner. |
| Jumping Character | `character-jumping` | 1080×1080 (1:1) | 4s @ 30fps | A simple character celebrates with a loop-ready jump. |
| Social Reel Frame | `social-reel` | 1920×1080 (16:9) | 5s @ 30fps | A reel-style frame with handle, caption and progress. |
| Split Screen | `split-screen` | 1920×1080 (16:9) | 5s @ 30fps | Two panels slide in for a side-by-side comparison. |
| Thinking Bubble | `thinking-bubble` | 1080×1080 (1:1) | 4s @ 30fps | A thought bubble inflates with animated dots. |
| Waving Hello | `wave-hello` | 1080×1080 (1:1) | 3s @ 30fps | A friendly hand waves hello — instant icebreaker. |

### Loops & Backgrounds

| Template | Composition ID | Size | Length | What it does |
|---|---|---|---|---|
| Bokeh Loop | `bokeh-circles` | 1920×1080 (16:9) | 5s @ 30fps | Soft out-of-focus lights drift in a seamless loop. |
| Fireworks Burst | `fireworks-burst` | 1080×1080 (1:1) | 3.7s @ 30fps | Fireworks bloom on cue — stack them for finales. |
| Grid Wave Loop | `loop-grid-wave` | 1920×1080 (16:9) | 3s @ 30fps | A dot grid undulates in a hypnotic endless wave. |
| Parallax Pan | `parallax-pan` | 1920×1080 (16:9) | 4s @ 30fps | Layered planes pan at different speeds for depth. |
| Pencil Draw-On | `pencil-draw` | 1080×1080 (1:1) | 3.3s @ 30fps | A pencil sketches your shape in, line by line. |
| Pixel Waterfall | `pixel-waterfall-cycle` | 1080×1920 (9:16) | 6s @ 30fps | A pixel-art waterfall cycles forever (9:16). |
| Snow Particles | `particle-snow` | 1080×1080 (1:1) | 5s @ 30fps | Snow drifts down in layers with gentle depth. |
| Starfield | `starfield` | 1920×1080 (16:9) | 5s @ 30fps | Stars stream past like a slow warp-speed flight. |

## Using a template in your own project

Copy the template's folder into your Remotion project (and `src/pixel-kit/` for the pixel-art ones), import the component and its default props, and register it with `<Composition>` the same way `src/Root.tsx` does here. Keep the SPDX header at the top of the file — that satisfies the MIT notice requirement.

## Want more?

These 50 are yours to keep. The full RenderComp catalog has 1,000+ templates: https://rendercomp.com/

## License

**Templates: MIT.** Everything in this repository is released under the MIT License
(see `LICENSE`). You are free to use, modify and redistribute these templates,
including in commercial projects, as long as the MIT copyright and permission
notice is retained.

**Remotion itself is licensed separately.** Remotion is not MIT-licensed and is not
distributed by this repository — it is installed as a dependency. Remotion is free
for individuals and small companies, and larger teams need a Remotion Company
License. Check the current terms before you ship:
https://www.remotion.dev/license · https://www.remotion.dev/docs/license
(checked 2026-08-29).

**Third-party licenses may apply to bundled assets.** Fonts, images, icons or audio
that ship inside a template remain under their own licenses. Where a template
bundles such an asset, its source and license are recorded in `ASSETS.md`. As
published, these templates use system font stacks and bundle no fonts. Assets you
add yourself are yours to license.

RenderComp is an independent project. It is not affiliated with, sponsored by, or
endorsed by Remotion. "Remotion" is a trademark of its respective owner and is used
here only to identify the framework these templates are built for.

## Issues and support

Issues are open for bug reports about these 50 templates (a template fails to type-check, render, or behaves differently from its preview). Please include your Node and Remotion versions and the composition ID. Feature requests, general Remotion questions, and support for other projects are out of scope for this repository, and there is no response-time guarantee. Security reports: see `SECURITY.md`.
