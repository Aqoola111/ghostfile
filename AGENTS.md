Here is the English version of the Project Context. Save this as docs/context.md in your project to ensure Cursor follows the exact engineering and design requirements.

Project Context: GhostFile (Swiss File Knife)
1. Vision & Core Values
GhostFile is a high-performance web utility designed for deep file analysis and binary modification.

Zero-Footprint: No registration, no databases, and zero server-side file storage.

Privacy First: Metadata stripping and binary analysis are performed strictly on the client side whenever possible.

Engineering Aesthetic: The design follows an "Industrial Brutalism" / "Cyber-Terminal" vibe. Avoid soft shadows and corporate "SaaS" styles. Use sharp borders, monospace fonts, and high-contrast elements.

2. Technical Stack
Framework: Next.js 15/16 (App Router).

Processing: Heavy utilization of ArrayBuffer, TypedArrays (Uint8Array), Web Workers, and ffmpeg.wasm.

Styling: Tailwind CSS 4.0 (Custom configuration based on Stitch design tokens).

Icons: Lucide React (Default strokeWidth: 1.5).

3. Key Functionalities
Binary Identity: Identify file types using Magic Numbers (binary signatures) instead of unreliable file extensions.

Metadata Inspector: Extract EXIF (images), ID3 (audio), and GPS data (visualized on an interactive map).

The Deep Purge: Reconstruct binary files by stripping metadata segments (e.g., removing APP1 markers in JPEG buffers).

Hex Viewer: A specialized component for interactive inspection of raw file bytes.

Client-side Converters: Image and media processing via Canvas API and WebAssembly (WASM).

4. UI/UX Rules
Typography: Use Monospace fonts (JetBrains Mono / Geist Mono) for all data displays, Hex grids, and technical labels.

Colors: Deep charcoal backgrounds, vibrant accents (Electric Lime or Cyber Orange).

Layout: A massive central Drop-zone that dynamically transforms into a multi-column "Engineering Dashboard" once a file is loaded.

Motion: No "bouncy" or "playful" animations. Use fast, linear, and strict transitions only.

5. File Handling Logic
Initial Scan: Always read the first 12–16 bytes of a file immediately onDrop for instant signature identification.

Memory Management: Use URL.createObjectURL for previews and strictly implement URL.revokeObjectURL to prevent memory leaks.

Concurrency: Automatically offload processing for files larger than 20MB to Web Workers to keep the UI thread responsive.

Instructions for Cursor:
Reference this file: Use @context.md in your prompts to maintain architectural consistency.

Design Alignment: Always cross-reference the design provided by the Stitch MCP or screenshots with the "Engineering Aesthetic" defined here.

Logic Priority: Prioritize native Web APIs (FileSystem, Streams, TypedArrays) over external libraries for core file manipulation.