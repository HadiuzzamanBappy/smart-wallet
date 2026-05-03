# Studio Executive v2: UI Design Skill

This document defines the mandatory design patterns for the Wallet Tracker application. The Agent MUST follow these rules for all UI-related tasks.

## 1. Typography & Casing

- **NO Force-Capitalization**: Avoid using `uppercase` for headings or body text.
- **Natural Casing**: Use Sentence case for almost everything.
- **Exceptions**: Only use `uppercase` for very small "Overline" labels (e.g., category badges) with `tracking-widest`.

## 2. The Semantic Palette (Mandatory)

- **Primary**: Teal (#14b8a6) - Action/Identity.
- **Secondary**: Purple (#8b5cf6) - Alternative Action.
- **Success/Error/Warning/info**: Emerald/Rose/Amber - Semantic state.
- **Neutrals**:
  - `paper`: Expensive off-whites for light mode.
  - `ink`: Deep midnight navy for dark mode.
- **Transparency**: Use Tailwind opacity modifiers (`/20`, `/50`) for all glass effects.

## 3. Base Component Sovereignty (Strict)

- **Mandatory Usage**: You MUST use base components from `src/components/UI/base` for every UI element. Raw HTML tags are forbidden for buttons, cards, inputs, etc unless neccessary.
- **Missing Components**: If a required UI pattern does not have a base component, you MUST create it in the `base` directory with full variants before using it.
- **No Overwriting**: Do not use `className` props to override the core design of a base component. The component's internal design is the single source of truth.
- **Variant Logic**: If a component needs a new look, add a new `variant` to the base component itself rather than styling it in-line.

## 4. Layout & Spacing

- **Radius**: Use `rounded-2xl` for inputs/buttons and `rounded-3xl` for cards.
- **Spacing**: Use minimal,compact and high-density gaps (e.g., `gap-2`, `p-3`, `p-2`).
- **Glassmorphism**: Always pair `backdrop-blur-xl` with a thin border (`border-white/20` or `border-ink-500/10`).
