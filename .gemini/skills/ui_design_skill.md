# Studio Executive v2: UI Design Skill

This document defines the architectural approach for the Wallet Tracker application. The Agent MUST follow these rules to maintain design system integrity while allowing for specialized component complexity.

## 1. Typography & Casing

- **Semantic Tokens**: Use the centralized tokens in `tailwind.config.cjs` (e.g., `text-h1`, `text-body`, `text-overline`) instead of arbitrary sizes.
- **Ultra-Thin Standards**: Maintain a premium executive aesthetic by strictly using **Font Weight 300** for `text-body` and `text-value`. Labels use Weight 400.
- **Natural Casing**: Use Sentence case for almost everything.
- **Overlines**: Use `text-overline` (Weight 600) for small labels. Note that `text-overline` already includes `uppercase` and `tracking-widest`.
- **Consistency**: Maintain existing font-weight and tracking patterns found in the theme config.

## 2. The Semantic Palette (Mandatory)

- **Thematic Consistency**: Every UI element MUST use the centralized color palette defined in `tailwind.config.cjs`.
- **Tokens**: Use semantic tokens like `primary`, `secondary`, `success`, `error`, `paper`, and `ink`.
- **Contrast Hierarchy**: Ensure clear separation by dimming secondary info. For example, subtitles in headers should default to **`opacity-60`**.
- **Transparency**: Leverage Tailwind's opacity modifiers (e.g., `primary-500/20`) for glass effects to ensure easy global theme switching.

## 3. Base Component Architecture

- **Sovereignty**: If a base component exists in `src/components/UI/base`, use it as the primary choice.
- **Header Flexibility**: Use `SectionHeader` for all headers, utilizing the `titleSize` prop (`text-h3` for sections, `text-h6` for widgets) to maintain hierarchy.
- **Named Groups (Hover Isolation)**: When nesting interactive cards (like list items inside a widget), use **Named Groups** (e.g., `group/widget` or `group/item`) in `GlassCard` to prevent hover bleed.
- **Discovery Patterns**: Interactive suggestions or templates should sitting at **`opacity-40`** by default and transition to **`opacity-100`** on hover.
- **Evolutionary Design**: 
  - If you are writing raw Tailwind code for a pattern that feels reusable, search for an existing base component.
  - If no suitable base component exists, **you MUST create a new base component** in the `base` directory to house that pattern.

## 4. Visual Philosophy (The "Executive" Standard)

- **Density**: Prioritize extreme density for a "Financial Command Center" aesthetic.
  - **Baseline Padding**: Use **`p-3`** or **`p-4`** for containers. **`p-5`** is reserved for large, hero-style sections.
  - **Compact Grid**: Use **`gap-2`** or **`gap-3`** for internal layouts.
  - **High-Density Scaling**: Many components (Inputs, Selects, Buttons) now support a **`size="sm"`** variant using **`text-label`** (text-[11px]) and **`rounded-xl`**.
- **Radius (Adaptive)**:
  - **Compact (sm)**: Standardize on **`rounded-xl`**.
  - **Standard (md)**: Standardize on **`rounded-2xl`**.
  - **Containers (lg/xl)**: Standardize on **`rounded-3xl`** or **`rounded-[2rem]`**.
- **Typography & Hierarchy**:
  - **Modal Titles**: Use **`text-h5 font-bold`** or **`text-h4`** for modal/dialog headers to prevent visual overwhelming.
  - **Metric Labels**: Use **`text-[7px]`** or **`text-[8px]` font-black uppercase** for ultra-compact data labels.
- **Glassmorphism**: Combine `backdrop-blur-3xl` with surgical, translucent borders (`border-paper-200/30` or `border-paper-900/10`).
- **Loading States**: Standardize on **`Loader2`** from `lucide-react` for spinners. Use **`animate-spin opacity-80`**.
- **Refined Accents**: Use thin accent borders (e.g., **`border-l-2`** in Toasts) instead of thick ones to maintain a minimal feel.
- **Micro-Animations**: Use subtle `translate-x-1`, `scale-[0.98]`, or `hover:bg-primary-500/10` for tactile, premium feedback.
- **Responsive Design**: All components MUST adapt fluidly across mobile and desktop breakpoints using Tailwind prefixes.

## 5. Development Workflow

- **Check First**: Before building any UI, audit the `base` directory.
- **Standardize**: If you find yourself repeating raw styles across multiple files, extract them into a new base component.
- **Theme Resilience**: Avoid hardcoded hex codes. Always use the Tailwind utility classes that reference the theme config.
- **Minimalism Overload**: When in doubt, reduce padding, shrink typography, and thin the borders.
