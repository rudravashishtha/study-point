# Study Point Design System

## Brand Personality

**Study Point** is a premium mathematics institute, not a generic software product landing page or a dark-mode developer tool. The brand personality combines:

- Mathematical depth
- Spatial composition
- Interactive vectors
- Coordinate systems
- Plotted relationships
- Responsive light
- Academic credibility
- Human warmth
- Editorial clarity

## Selected Visual Direction

**Dynamic Vectors & Light** (Concept 3) is the selected visual direction. It leverages subtle interactive coordinate fields, plotted points forming relationships, and dynamic light to communicate deep mathematical understanding. It is NOT a generic dark-mode AI, crypto, or cybersecurity theme. It is carefully balanced across three distinct surfaces: Public, Student, and Admin.

### Rejected Visual Directions

- **Spatial Geometry & Glass:** Rejected because heavy 3D CSS transforms and frosted glass panels can feel too much like a generic developer tool or tech startup rather than an academic institute.
- **Mathematical Elegance:** Rejected because while classic ink-and-paper aesthetics provide academic credibility, they lack the spatial depth and modern motion-aware engagement required to make the digital platform memorable.

## Typography System

Typography is critical for mathematical presentation and dense UI readability.

- **Display Typography:** `Outfit`. A modern, bold, geometric sans-serif that provides a friendly but sharp identity for marketing and large headings.
- **UI & Body Typography:** `Manrope`. A clean, highly legible sans-serif. Excellent for data-dense tables in the admin dashboard and readable body copy. Tabular numeral features are used for general numbers, fees, marks, and dates.
- **Technical Accent:** `JetBrains Mono`. A highly technical monospace font used **strictly and selectively** for:
  - Coordinate labels
  - Graph axes
  - Equation annotations
  - Technical mathematical visual elements
  - Student IDs or intentionally technical metadata
    _(It must not be used for ordinary body content or general UI numbers just because this is a math product.)_

_Note: The current Latin typography stack does not natively support Devanagari/Hindi. Future Hindi support will require an explicit compatible fallback or typography extension._

## Colour System & Semantic Tokens

Semantic design tokens are used to style the application. Literal colour values are isolated in `globals.css` as CSS variables.

- `--surface`: The deepest background layer.
- `--surface-elevated`: Floating panels, cards, or sticky headers.
- `--surface-interactive`: Hover states or pressed states for surface elements.
- `--brand-glow`: A primary accent color that emits a soft radial light in specific public sections.

## Spacing and Composition Principles

- Use ample negative space.
- Group related items with subtle borders rather than strong solid boxes.
- Create visual rhythm through consistent paddings (`px-4 sm:px-6 lg:px-8`) and large vertical margins (`py-24` or `py-32`) between sections on the public site.

## Surface and Depth Principles

- **Public Website:** The most expressive surface. Uses visual storytelling, mathematical depth, strong composition, and memorable motion. E.g., The Hero section features a spatial mathematical environment, while Courses and Results use high-clarity academic presentation.
- **Student Portal:** An energetic personal academic command centre. Tactile and motivating, focusing on useful actions. Uses hover-lift effects and floating navigation.
- **Admin Dashboard:** A precision instrument. Fast, dense, responsive, and premium. Its visual quality comes from excellent typography, hierarchy, spacing, crisp states, and micro-motion (e.g., active tab indicators) rather than decorative glow or 3D.

## Mathematics-Inspired Visual Language

- Explore interactive coordinate fields, plotted points, relationships between points, vector construction, and curves emerging from those relationships.
- Use pointer-responsive spatial depth and ambient light to create parallax without heavy 3D.
- **DO NOT** use random floating mathematical symbols, calculator icons, or generic school stationery.

## Motion System

- Dependency: `motion/react` is the only approved animation library.
- Use for:
  - Entrance choreography
  - Shared layout motion (e.g., active tab indicators)
  - Navigation indicators
  - Hover and press interactions
  - Spring-based physics interactions
  - Selective scroll-linked effects
  - Reduced-motion support (Respect `prefers-reduced-motion`).
- **DO NOT** mechanically animate every component or add generic route transitions to every route without a planned App Router transition architecture.

## 3D Usage Rules

- Do not install WebGL, Three.js, React Three Fiber, or other heavy 3D stacks during Phase 3.
- Rely on CSS, SVG, and Motion-based interactions to prove spatial depth and parallax before considering true 3D contexts.

## Component Styling Principles

- `shadcn/ui` is strictly a primitive foundation. It must not define the visible identity of Study Point.
- Override default Tailwind borders and shadows to match the Semantic Tokens.
- Ensure all interactive elements have clear focus states (`focus-visible:ring-2`).

## Accessibility & Performance

- All interactions must remain accessible to screen readers.
- Respect `prefers-reduced-motion` for all `motion/react` animations.
- Maintain strict performance budgets: Do not load multiple overlapping animation libraries. Fonts are bundled via `@fontsource` to avoid live external fetches during builds.

## Component Composition

- Prefer **composition over configuration**.
- Construct larger UI patterns by composing existing shared shadcn primitives (`Table`, `Input`, `Button`, `Select`, etc.) instead of introducing new wrapper components with massive prop APIs.
- Avoid "God components".
- Maintain structural components like `PageHeader` and `DataListToolbar` strictly for layout semantics (they should not be aware of business logic, routing, or specific entities).
