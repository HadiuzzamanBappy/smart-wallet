# Wallet-Tracker — MVP Quick Start

Purpose: a minimal entrypoint describing the smallest working surface (MVP) to run, test, and extend the app.

Minimal goal:

- Run the app locally, sign in with a test Firebase account, add/save a transaction via the chat, and observe the live balance update.

Key files to touch for MVP:

- `src/config/firebase.js` — add your Firebase project's config (see `SETUP.md`).
- `src/components/Dashboard/ChatWidget.jsx` — the natural-language entry point for creating transactions.
- `src/services/transactionService.js` — handles add/edit/delete transactions and updates encrypted user totals.
- `src/utils/encryption.js` — encrypt/decrypt helpers used before writing/after reading Firestore.

Commands:

```powershell
npm install
npm run dev
```

Quick manual test:

1. Start dev server.
2. Create a Firebase test user, or sign in with Google if configured.
3. Open the chat and type: "Bought groceries 500".
4. Confirm a new transaction appears and the dashboard balance updates.

If that flow works, the MVP is functioning.
