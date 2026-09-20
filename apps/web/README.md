# Kobrixa web

React + Vite website for the product pages, documentation and browser-based EV3 media tools.

## Source layout

```text
src/
├── main.tsx                    # React bootstrap; global CSS is loaded last
├── vite-env.d.ts               # Vite asset import declarations
├── app/
│   ├── app.tsx                # Locale persistence, outlet and route focus/scroll behavior
│   └── router.tsx             # Route table and page wiring
├── components/                # Navigation shared across pages, with its CSS
├── features/
│   ├── home/                  # Home page and its content
│   ├── product/               # Features and download pages, with their CSS
│   ├── docs/                  # Documentation pages, Markdown imports and API reference
│   └── tools/
│       ├── tools-page.tsx     # Media studio tabs and page layout
│       ├── tools.css          # Media studio styles
│       ├── components/        # Image/audio editors and tool-specific UI
│       └── lib/               # Conversion, encoding, export helpers and colocated tests
└── styles/
    └── global.css             # Existing site-wide stylesheet, including home/docs styles
```

Keep feature-specific components and logic inside their feature. Put components in
`src/components/` only when multiple page features use them. Keep tests beside the
module they cover as `*.test.ts`; the web Vitest configuration discovers them recursively.
Use direct relative imports with `.js` specifiers for TypeScript modules, matching the
workspace's NodeNext convention. No barrel exports are required.

Documentation Markdown remains in the repository's `docs/` directory and is imported
by `features/docs/docs-content.ts`. Static public files stay in `public/`; source artwork
stays in `artwork/`. The HTML entry point remains `/src/main.tsx`.

## Local commands

Run from the repository root:

```sh
pnpm --filter @kobrixa/web dev
pnpm --filter @kobrixa/web check
pnpm --filter @kobrixa/web test
pnpm --filter @kobrixa/web build
```
