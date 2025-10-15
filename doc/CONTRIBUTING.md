# Contributing to Smart Wallet

Thanks for contributing! The instructions below explain the standard developer workflow for this repository.

## Development setup

```powershell
# 1. Fork and clone
git clone <your-fork-url>
cd Wallet-Tracker

# 2. Install dependencies
npm install

# 3. Create local env file from example
copy .env.example .env.local
# Edit .env.local and add your Firebase keys (do NOT commit this file)

# 4. Start development server
npm run dev
```

Notes:

- The project reads environment variables via Vite (`import.meta.env`). Use `.env.local` for local overrides.

## Code standards

- **ESLint**: Run `npm run lint` before committing.
- **Components**: Prefer functional components with hooks.
- **Naming**: Use camelCase for variables, PascalCase for component names.
- **Imports**: Use absolute imports from `src/` where convenient.

## File structure (high level)

```text
src/
├── components/     # React components
├── services/       # Business logic (auth, transactions, budgets)
├── hooks/          # Custom React hooks
├── context/        # React context providers
├── utils/          # Helpers (encryption, ai parser)
└── config/         # Config and firebase initialization
```

## Making changes

1. Create a branch: `git checkout -b feat/your-feature`
2. Implement your changes and add tests where appropriate.
3. Run the dev server and test locally: `npm run dev`.
4. Lint your changes: `npm run lint`.
5. Commit with a clear message and push: `git push origin feat/your-feature`.
6. Open a Pull Request describing the change, how to test, and any impact.

## Pull request guidelines

- Title: short and descriptive.
- Description: explain what, why, and how to test.
- Include screenshots for UI changes.

## Important notes

- **Security**: Never commit `.env.local` or any secrets.
- **Encryption**: Sensitive user data is encrypted client-side — keep encryption helpers intact.
- **Firestore rules**: Test security rules with the emulator before publishing.
- **Dependencies**: Keep third-party dependencies minimal and browser-compatible.

## Getting help

- Search existing issues first.
- Open a discussion for design/architecture questions.
- File issues with reproduction steps for bugs.

## Development commands

```powershell
npm run dev         # Start development server with HMR
npm run build       # Build production bundle
npm run preview     # Preview production build locally
npm run lint        # Run ESLint
npm run deploy      # Build and deploy via Firebase CLI (predeploy builds)
```
