# GhostFile

**GhostFile** is a client-first web utility for inspecting binaries, reading metadata, and stripping sensitive segments—styled like a precision terminal (“Swiss File Knife” for files). The goal is **zero server-side file storage**, **no accounts**, and **maximum work in the browser** (typed arrays, workers, WASM).

> Full product rules, stack choices, and UX constraints live in [`AGENTS.md`](./AGENTS.md). Point Cursor at `@AGENTS.md` when implementing features.

## Current state

The repo is an active scaffold: **Next.js App Router**, **Tailwind CSS v4**, **shadcn/ui** (Radix Vega), and a **Stitch-aligned** dark theme (Space Grotesk + JetBrains Mono, electric lime accent, sharp geometry).

Implemented UI pieces include:

- **File dropzone** (`components/custom/dropzone.tsx`) — `react-dropzone`, brutalist frame, optional GSAP hover copy via `HoverRadialText`.
- **`HoverRadialText`** — reusable pointer-driven color wave for strings (see file for props).
- **Button** — GSAP `clip-path` ripple fill from cursor position (disabled for `link` and `asChild`).
- **Safe mode store** (`store/use-safemode-store.ts`) — minimal Zustand flag for future “safe” pipelines.

Planned capabilities (see `AGENTS.md`): magic-number identification, EXIF / ID3 / GPS, hex view, deep purge (e.g. JPEG APP1), ffmpeg.wasm workflows, and a post-drop engineering dashboard layout.

## Tech stack

| Area        | Choice |
|------------|--------|
| Framework  | [Next.js](https://nextjs.org/) 16 (App Router, React 19) |
| Styling    | Tailwind CSS v4, design tokens in `app/globals.css` |
| Components | shadcn/ui (`components.json`), Radix primitives |
| Icons      | Lucide (`strokeWidth` 1.5 in new UI) |
| Motion     | GSAP 3 (button ripple, optional text hover) |
| State      | Zustand (small global flags) |
| Upload UX  | `react-dropzone` |

## Getting started

Requirements: **Node.js 20+** (matches `engines` expectations of current Next tooling).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command        | Description |
|----------------|-------------|
| `npm run dev`  | Next dev server (Turbopack) |
| `npm run build`| Production build + typecheck |
| `npm run start`| Serve production build |
| `npm run lint` | ESLint |

## Project layout

```
app/
  layout.tsx      # Root layout, fonts, `dark` class for shadcn
  page.tsx        # Home route
  globals.css     # Stitch / GhostFile + shadcn semantic tokens
components/
  ui/             # shadcn-generated primitives (e.g. button)
  custom/         # App-specific (dropzone, hover-radial-text, …)
lib/
  utils.ts        # `cn`, helpers
store/
  use-safemode-store.ts
```

## Design system

Visual language follows **Google Stitch** project *GhostFile Binary Terminal*: charcoal surfaces, lime accent (`--primary` / `--gf-accent`), no pill radii on global tokens, monospace for machine-facing labels.

When iterating UI in Cursor, you can align with Stitch via the **Stitch MCP** (design systems / screens) and keep tokens consistent with `app/globals.css`.

## Agent / IDE notes

- **`AGENTS.md`** — product vision, file-handling rules, and stack.
- **`CLAUDE.md`** — includes `@AGENTS.md` for Claude-oriented workflows.
- **`.cursorrules`** — Cursor-specific engineering rules for this repo.

## License

Private (`"private": true` in `package.json`). Add a license file if you open-source the project.
