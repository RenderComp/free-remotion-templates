# 50 Free Remotion Templates

MIT-licensed [Remotion](https://www.remotion.dev/) templates from [RenderComp](https://rendercomp.com/). Each one is a React component that renders to MP4. Clone the repo, open the studio, and all fifty are there.

![All 50 templates playing at once](docs/hero-50-templates.gif)

## Quick start

```bash
git clone https://github.com/RenderComp/free-remotion-templates.git
cd free-remotion-templates && npm install
npm run dev
```

Remotion Studio opens at http://localhost:3000 with the 50 templates in the sidebar, grouped by category. Change the props in the right-hand panel to make one yours, then render it by composition ID:

```bash
npm run render -- kpi-counter        # writes out/kpi-counter.mp4
```

You need a current Node.js LTS. The first render downloads a headless browser once and takes a few minutes; later renders are much faster.

## The templates

Every template is one `.tsx` file under `src/components/<composition-id>/` with typed props and defaults that already look finished. No fonts, images, or audio are bundled, and the only dependencies are `remotion` and `react`. The six pixel-art templates share a helper module in `src/pixel-kit/`.

### Logo & Brand (8)

| Preview | Template | What it does | Render |
|---|---|---|---|
| <img src="docs/thumbs/brush-stroke-reveal.gif" alt="Brush Stroke Reveal" width="200"> | **Brush Stroke Reveal**<br>1920×1080 · 4s | A paint brush stroke sweeps in and carries your mark. | `npm run render -- brush-stroke-reveal` |
| <img src="docs/thumbs/logo-blur-reveal.gif" alt="Logo Blur Reveal" width="200"> | **Logo Blur Reveal**<br>1920×1080 · 4s | Logo sharpens out of a soft blur into focus. | `npm run render -- logo-blur-reveal` |
| <img src="docs/thumbs/logo-bounce-drop.gif" alt="Logo Bounce Drop" width="200"> | **Logo Bounce Drop**<br>1920×1080 · 3s | Logo drops in and settles with a springy bounce. | `npm run render -- logo-bounce-drop` |
| <img src="docs/thumbs/logo-mask-wipe.gif" alt="Logo Mask Wipe" width="200"> | **Logo Mask Wipe**<br>1920×1080 · 3.33s | A diagonal mask wipes across to expose the logo. | `npm run render -- logo-mask-wipe` |
| <img src="docs/thumbs/logo-split-reveal.gif" alt="Logo Split Reveal" width="200"> | **Logo Split Reveal**<br>1920×1080 · 4s | Two panels split apart to reveal the logo between them. | `npm run render -- logo-split-reveal` |
| <img src="docs/thumbs/logo-stroke-draw.gif" alt="Logo Stroke Draw" width="200"> | **Logo Stroke Draw**<br>1920×1080 · 3.67s | Traces your logo outline stroke by stroke, then fills. | `npm run render -- logo-stroke-draw` |
| <img src="docs/thumbs/neon-sign.gif" alt="Neon Sign Flicker" width="200"> | **Neon Sign Flicker**<br>1080×1080 · 3.33s | Your text buzzes on like a neon tube, flicker and all. | `npm run render -- neon-sign` |
| <img src="docs/thumbs/shatter-reveal.gif" alt="Shatter Reveal" width="200"> | **Shatter Reveal**<br>1920×1080 · 4s | The cover layer shatters into shards, revealing what's behind. | `npm run render -- shatter-reveal` |

### Text & Titles (11)

| Preview | Template | What it does | Render |
|---|---|---|---|
| <img src="docs/thumbs/bounce-in-headline.gif" alt="Bounce-In Headline" width="200"> | **Bounce-In Headline**<br>1920×1080 · 4s | The headline lands with an elastic bounce, word by word. | `npm run render -- bounce-in-headline` |
| <img src="docs/thumbs/chapter-title.gif" alt="Chapter Title Card" width="200"> | **Chapter Title Card**<br>1920×1080 · 5s | A clean numbered chapter card for section breaks. | `npm run render -- chapter-title` |
| <img src="docs/thumbs/four-tone-mono-titler.gif" alt="Four-Tone Titler" width="200"> | **Four-Tone Titler**<br>1920×1080 · 4s | A duotone title block that steps through four color states. | `npm run render -- four-tone-mono-titler` |
| <img src="docs/thumbs/glitch-text.gif" alt="Glitch Text" width="200"> | **Glitch Text**<br>1920×1080 · 4s | RGB-split glitches tear the title before it stabilizes. | `npm run render -- glitch-text` |
| <img src="docs/thumbs/gradient-text-sweep.gif" alt="Gradient Sweep Title" width="200"> | **Gradient Sweep Title**<br>1920×1080 · 3.67s | A color gradient sweeps through the headline. | `npm run render -- gradient-text-sweep` |
| <img src="docs/thumbs/kinetic-word-stack.gif" alt="Kinetic Word Stack" width="200"> | **Kinetic Word Stack**<br>1920×1080 · 4s | Words punch in and stack into a bold kinetic block. | `npm run render -- kinetic-word-stack` |
| <img src="docs/thumbs/pixel-typewriter-quote.gif" alt="Pixel Typewriter Quote" width="200"> | **Pixel Typewriter Quote**<br>1920×1080 · 6s | A retro pixel-font quote typed onto the screen. | `npm run render -- pixel-typewriter-quote` |
| <img src="docs/thumbs/scramble-text.gif" alt="Scramble Text" width="200"> | **Scramble Text**<br>1920×1080 · 5s | Characters cycle randomly, then lock into your headline. | `npm run render -- scramble-text` |
| <img src="docs/thumbs/text-mask-reveal.gif" alt="Text Mask Reveal" width="200"> | **Text Mask Reveal**<br>1920×1080 · 3.67s | Text slides up out of an invisible mask line. | `npm run render -- text-mask-reveal` |
| <img src="docs/thumbs/typewriter.gif" alt="Typewriter" width="200"> | **Typewriter**<br>1080×1080 · 3.33s | Types your copy character by character, cursor included. | `npm run render -- typewriter` |
| <img src="docs/thumbs/wave-text.gif" alt="Wave Text" width="200"> | **Wave Text**<br>1920×1080 · 5s | Letters ride a smooth wave, one after another. | `npm run render -- wave-text` |

### Transitions (8)

| Preview | Template | What it does | Render |
|---|---|---|---|
| <img src="docs/thumbs/camera-shake.gif" alt="Camera Shake" width="200"> | **Camera Shake**<br>1920×1080 · 4s | Adds handheld impact shake to any cut or hit. | `npm run render -- camera-shake` |
| <img src="docs/thumbs/card-flip-transition.gif" alt="Card Flip" width="200"> | **Card Flip**<br>1920×1080 · 4s | The whole frame flips over like a card to the next scene. | `npm run render -- card-flip-transition` |
| <img src="docs/thumbs/transition-circle-wipe.gif" alt="Circle Wipe" width="200"> | **Circle Wipe**<br>1920×1080 · 3s | A circle expands from center to swallow the scene. | `npm run render -- transition-circle-wipe` |
| <img src="docs/thumbs/ink-spread-transition.gif" alt="Ink Spread" width="200"> | **Ink Spread**<br>1920×1080 · 4s | Ink blots spread and flood the frame into the next scene. | `npm run render -- ink-spread-transition` |
| <img src="docs/thumbs/flip-page-transition.gif" alt="Page Flip" width="200"> | **Page Flip**<br>1920×1080 · 4s | A page turn carries scene A over to scene B. | `npm run render -- flip-page-transition` |
| <img src="docs/thumbs/pixel-mosaic-transition.gif" alt="Pixel Mosaic Transition" width="200"> | **Pixel Mosaic Transition**<br>1920×1080 · 3s | The frame dissolves into pixel blocks and reassembles. | `npm run render -- pixel-mosaic-transition` |
| <img src="docs/thumbs/slide-wipe.gif" alt="Slide Wipe" width="200"> | **Slide Wipe**<br>1920×1080 · 4s | A clean directional slide pushes the old frame out. | `npm run render -- slide-wipe` |
| <img src="docs/thumbs/whip-pan.gif" alt="Whip Pan" width="200"> | **Whip Pan**<br>1920×1080 · 4s | A fast blurred pan whips from one scene to the next. | `npm run render -- whip-pan` |

### Data & Charts (6)

| Preview | Template | What it does | Render |
|---|---|---|---|
| <img src="docs/thumbs/bar-chart-anim.gif" alt="Animated Bar Chart" width="200"> | **Animated Bar Chart**<br>1920×1080 · 5s | Bars grow to your values in sequence. | `npm run render -- bar-chart-anim` |
| <img src="docs/thumbs/line-chart-anim.gif" alt="Animated Line Chart" width="200"> | **Animated Line Chart**<br>1920×1080 · 5s | A line draws itself across the axes to your data. | `npm run render -- line-chart-anim` |
| <img src="docs/thumbs/pourover-drip-fill-gauge.gif" alt="Drip Fill Gauge" width="200"> | **Drip Fill Gauge**<br>1920×1080 · 6s | A gauge fills drop by drop to the target percentage. | `npm run render -- pourover-drip-fill-gauge` |
| <img src="docs/thumbs/kpi-counter.gif" alt="KPI Counter" width="200"> | **KPI Counter**<br>1920×1080 · 4s | A number counts up to your metric with its label. | `npm run render -- kpi-counter` |
| <img src="docs/thumbs/pixel-candlestick-ohlc.gif" alt="Pixel Candlestick" width="200"> | **Pixel Candlestick**<br>1920×1080 · 6s | A retro pixel OHLC chart plays out your price data. | `npm run render -- pixel-candlestick-ohlc` |
| <img src="docs/thumbs/racing-chart.gif" alt="Racing Bar Chart" width="200"> | **Racing Bar Chart**<br>1920×1080 · 7s | Ranked bars overtake each other as values change. | `npm run render -- racing-chart` |

### Social & UI (9)

| Preview | Template | What it does | Render |
|---|---|---|---|
| <img src="docs/thumbs/community-chat.gif" alt="Chat Conversation" width="200"> | **Chat Conversation**<br>1080×1920 · 9s | Message bubbles pop in like a live chat thread (9:16). | `npm run render -- community-chat` |
| <img src="docs/thumbs/end-card.gif" alt="End Card / Outro" width="200"> | **End Card / Outro**<br>1920×1080 · 5s | A closing card with CTA slots for subscribe and links. | `npm run render -- end-card` |
| <img src="docs/thumbs/eye-reveal.gif" alt="Eye Blink Reveal" width="200"> | **Eye Blink Reveal**<br>1080×1080 · 3s | An eye opens and its iris reveals your scene. | `npm run render -- eye-reveal` |
| <img src="docs/thumbs/lower-third-glass-card.gif" alt="Glass Lower Third" width="200"> | **Glass Lower Third**<br>1920×1080 · 4s | A frosted-glass name plate slides in from the corner. | `npm run render -- lower-third-glass-card` |
| <img src="docs/thumbs/character-jumping.gif" alt="Jumping Character" width="200"> | **Jumping Character**<br>1080×1080 · 4s | A simple character celebrates with a loop-ready jump. | `npm run render -- character-jumping` |
| <img src="docs/thumbs/social-reel.gif" alt="Social Reel Frame" width="200"> | **Social Reel Frame**<br>1920×1080 · 5s | A reel-style frame with handle, caption and progress. | `npm run render -- social-reel` |
| <img src="docs/thumbs/split-screen.gif" alt="Split Screen" width="200"> | **Split Screen**<br>1920×1080 · 5s | Two panels slide in for a side-by-side comparison. | `npm run render -- split-screen` |
| <img src="docs/thumbs/thinking-bubble.gif" alt="Thinking Bubble" width="200"> | **Thinking Bubble**<br>1080×1080 · 4s | A thought bubble inflates with animated dots. | `npm run render -- thinking-bubble` |
| <img src="docs/thumbs/wave-hello.gif" alt="Waving Hello" width="200"> | **Waving Hello**<br>1080×1080 · 3s | A friendly hand waves hello, an instant icebreaker. | `npm run render -- wave-hello` |

### Loops & Backgrounds (8)

| Preview | Template | What it does | Render |
|---|---|---|---|
| <img src="docs/thumbs/bokeh-circles.gif" alt="Bokeh Loop" width="200"> | **Bokeh Loop**<br>1920×1080 · 5s | Soft out-of-focus lights drift in a seamless loop. | `npm run render -- bokeh-circles` |
| <img src="docs/thumbs/fireworks-burst.gif" alt="Fireworks Burst" width="200"> | **Fireworks Burst**<br>1080×1080 · 3.67s | Fireworks bloom on cue. Stack them for finales. | `npm run render -- fireworks-burst` |
| <img src="docs/thumbs/loop-grid-wave.gif" alt="Grid Wave Loop" width="200"> | **Grid Wave Loop**<br>1920×1080 · 3s | A dot grid undulates in a hypnotic endless wave. | `npm run render -- loop-grid-wave` |
| <img src="docs/thumbs/parallax-pan.gif" alt="Parallax Pan" width="200"> | **Parallax Pan**<br>1920×1080 · 4s | Layered planes pan at different speeds for depth. | `npm run render -- parallax-pan` |
| <img src="docs/thumbs/pencil-draw.gif" alt="Pencil Draw-On" width="200"> | **Pencil Draw-On**<br>1080×1080 · 3.33s | A pencil sketches your shape in, line by line. | `npm run render -- pencil-draw` |
| <img src="docs/thumbs/pixel-waterfall-cycle.gif" alt="Pixel Waterfall" width="200"> | **Pixel Waterfall**<br>1080×1920 · 6s | A pixel-art waterfall cycles forever (9:16). | `npm run render -- pixel-waterfall-cycle` |
| <img src="docs/thumbs/particle-snow.gif" alt="Snow Particles" width="200"> | **Snow Particles**<br>1080×1080 · 5s | Snow drifts down in layers with gentle depth. | `npm run render -- particle-snow` |
| <img src="docs/thumbs/starfield.gif" alt="Starfield" width="200"> | **Starfield**<br>1920×1080 · 5s | Stars stream past like a slow warp-speed flight. | `npm run render -- starfield` |

Video previews at full resolution: https://rendercomp.com/free

## Using a template in your own project

Copy the template's folder into your Remotion project (plus `src/pixel-kit/` for the pixel-art ones), import the component and its default props, and register it with `<Composition>` the way `src/Root.tsx` does here. Keep the SPDX header at the top of the file. That satisfies the MIT notice requirement.

## License

**Templates: MIT.** Everything in this repository is released under the MIT License (see `LICENSE`). Use, modify and redistribute them, including in commercial projects, as long as the MIT copyright and permission notice is retained.

**Remotion itself is licensed separately.** Remotion is not MIT-licensed and is not distributed by this repository. It is installed as a dependency. Remotion is free for individuals and small companies, and larger teams need a Remotion Company License. Check the current terms before you ship: https://www.remotion.dev/license · https://www.remotion.dev/docs/license (checked 2026-08-29).

**Third-party licenses may apply to bundled assets.** Fonts, images, icons or audio that ship inside a template stay under their own licenses. Where a template bundles such an asset, its source and license are recorded in `ASSETS.md`. As published, these templates use system font stacks and bundle no fonts. Assets you add yourself are yours to license.

RenderComp is an independent project. It is not affiliated with, sponsored by, or endorsed by Remotion. "Remotion" is a trademark of its respective owner and is used here only to identify the framework these templates are built for.

## Issues and support

Issues are open for bug reports about these 50 templates: a template fails to type-check, fails to render, or behaves differently from its preview. Include your Node and Remotion versions and the composition ID. Feature requests, general Remotion questions, and support for other projects are out of scope here, and there is no response-time guarantee. Security reports: see `SECURITY.md`.

## More templates

These 50 are yours to keep. The full RenderComp catalog has 1,000+ templates, pay once: https://rendercomp.com/
