## Wallet-Tracker — Copilot / AI agent instructions

This file gives focused, actionable context so an AI coding agent can be productive quickly in this repository.

Keep guidance concise. When making code changes, prefer minimal, well-tested edits and follow the project's existing patterns.

1) Big picture
- Frontend-only React app (Vite) using Firebase Auth + Firestore. Key areas:
  - `src/components/` — UI components (Dashboard, Transaction, User, Layout)
  - `src/services/` — business logic that talks to Firebase (authService.js, transactionService.js)
  - `src/context/` and `src/hooks/` — app state via React Context and custom hooks
  - `src/utils/aiTransactionParser.js` — natural-language parser used by `ChatWidget.jsx`

2) Data flows & boundaries
- Firestore is the single source of truth; user documents live under `users/{uid}` and transactions under `users/{uid}/transactions` (see `src/config/firebase.js` and `transactionService.js`).
- Services in `src/services/` perform crypto/encryption, update user profile totals and emit DOM CustomEvents like `wallet:transaction-added`/`-edited`/`-deleted` that UI components listen to for refresh.

3) Developer workflows (commands)
- Dev server: `npm run dev`
- Build: `npm run build` (uses Vite)
- Lint: `npm run lint` (ESLint config in `eslint.config.js`)
- Deploy: `npm run deploy` (uses Firebase CLI)

4) Project-specific patterns and conventions
- Encryption: client-side helpers in `src/utils/encryption.js`. Field names written to Firestore use `_encrypted` suffix; plaintext fields should be removed when writing.
- Events: UI components rely on global CustomEvents for cross-component updates (search for `wallet:transaction-` in code). When mutating user totals, dispatch the appropriate event so summary/dashboard refreshes.
- Chat parsing: `ChatWidget.jsx` calls `parseTransaction` from `src/utils/aiTransactionParser.js`. Parser returns normalized objects: {type, amount, category, description, date}.
- Styling: Tailwind CSS; tailwind plugins are declared in `tailwind.config.cjs`. Prefer existing Tailwind classes for layout consistency.

5) Hotspots to inspect when changing behavior
- `src/services/transactionService.js` — adding/updating/deleting transactions and how user totals are recalculated.
- `src/utils/encryption.js` — any change must preserve encryption contract (decrypt on read, encrypt on write, no plaintext saved).
- `src/context/AuthContext.jsx` — user profile refresh, sign-in flows and re-authentication for sensitive ops.
- `src/components/Dashboard/CompactSummary.jsx` and `TransactionList.jsx` — display logic depending on decrypted profile and transaction lists.

6) Tests / validation to run after changes
- Lint: `npm run lint`
- Build: `npm run build`
- Smoke tests: run dev, sign-in with test user, create/edit/delete transactions and ensure events update the dashboard totals.

7) Small behavioral conventions
- Keep edits minimal: prefer adding feature flags or small helpers over large refactors.
- When adding dependencies, prefer lightweight browser-friendly packages. Avoid adding server-only libs to the frontend.
- If modifying encryption/storage, add a migration plan in the PR description for existing DB documents.

8) Where to document changes
- Update `README.md` for UX or feature-level changes.
- For data-migration or security changes, add a short migration script under `scripts/` and document usage in the PR.

If anything in these instructions is unclear or you want more coverage for tests, CI, or security/migration examples, tell me which area to expand.
