# 💰 Smart Wallet

A simple, secure personal finance tracker with client-side encryption.

<!-- Live demo preview -->

![Home Preview](/public/img/demo.png)

Try the live demo: [Open the live demo](https://smart-wallet-bro.vercel.app/)

---

## 🚀 Quick start

Follow these steps to run the project locally.

1. Clone the repository:

```bash
git clone https://github.com/HadiuzzamanBappy/Wallet-Tracker.git
cd Wallet-Tracker
```

1. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

1. Create a `.env.local` file with your Firebase configuration (example keys). You can copy the included `.env.example` and then edit the file:

```powershell
copy .env.example .env.local
# edit .env.local and fill in values
```

Example values (for reference):

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENROUTER_API_KEY=your_openrouter_key # optional
```

Notes:

- The project uses Vite. Dev server is available at <http://localhost:5173> by default.
- Keep your Firebase credentials private; do not commit `.env.local` to the repository.

---

## ✨ Features

- **🔒 Zero-Knowledge Security (Client-Side AES Encryption)**: Sensitive financial records (descriptions, categories, amounts, dates) are encrypted in the browser using AES-GCM before syncing to Google Firestore, ensuring absolute user privacy.
- **🧠 Multilingual AI Natural-Language Parser (Financial Assistant)**: Enter transactions using voice-to-text or typing in English, Bengali (বাংলা), Banglish, or mixed formats. Leverages OpenRouter API to automatically map transactions, categorize, and parse amounts (supporting abbreviations like 'k' or words like 'lakh/crore'). Includes a dynamic verification/editing queue.
- **📊 Executive Spending Analytics Suite**: Rich visual dashboards using `chart.js` featuring dynamic Trend line charts (income vs. expense vs. loans vs. credits), Activity breakdown doughnut charts, and 6-month historical comparisons, alongside instant KPI stats (Avg/Day, Outflow, Top category).
- **💼 Phased Salary & Financial Planner (Salary Manager)**: High-fidelity financial modeling wizard automating 50/30/20 splits (Needs/Wants/Savings), calculating U.S. HUD 30% rent safety overages, stress-testing Debt-to-Income (DTI) EMI limits (36%), and determining a 6-month Emergency Fund reserve runway with an AI advisor.
- **🤝 Advanced Debt, Loans, & Credit Tracker**: Standalone ledger for money borrowed (Loans) and money lent out (Credits), featuring partial repayments/collections with real-time principal deductions, principal adjustment histories with audit trails, and atomic transactional resets.
- **🌐 Dynamic Real-Time Multi-Language Translation**: Automatically translates the entire web page to Bengali (বাংলা) dynamically using LibreTranslate and MyMemory APIs. Uses a DOM `MutationObserver` to translate newly rendered dynamic components and input placeholders on the fly.
- **🎨 Custom Premium Design System & Playground**: Full design system using glassmorphic UI components, dark/light modes, premium typography, and an interactive UI showcase page reachable at `#components`.
- **🔄 Sync Across Devices**: Seamless cross-device data synchronization using Firebase Authentication + Firestore.

---

## 🛠️ Tech stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js (`react-chartjs-2`)
- **Backend**: Firebase Auth + Firestore
- **Encryption**: Client-side AES helpers (crypto-js)
- **AI Parsing**: OpenRouter (optional)
- **Dynamic Translation**: LibreTranslate API + MyMemory API (with DOM MutationObserver)

---

## 📁 Project structure (high level)

```text
src/
├── components/     # UI components (Dashboard, Transaction, User, UI)
├── services/       # Business logic (authService, transactionService, budgetService)
├── context/        # React contexts (Auth, Transaction, Theme)
├── hooks/          # Custom hooks (useAuth, useTransactions, useToast)
└── utils/          # Helpers (encryption, AI parser, helpers)
```

See the `doc/` folder for additional documentation: `ARCHITECTURE.md`, `MVP.md`, `MIGRATION.md`.

More docs:

- `doc/CONTRIBUTING.md` — development & contribution guidelines
- `doc/DEPLOYMENT.md` — deployment and hosting notes (includes rules deploy)

---

## 🔧 Development scripts

Run these from the project root.

```bash
npm run dev     # Start development server with HMR
npm run build   # Build production bundle
npm run preview # Preview production build locally
npm run lint    # Run ESLint
npm run deploy  # Deploy (project uses Firebase CLI for hosting)
npm run deploy:rules # Deploy only Firestore rules
```

---

## 🐛 Troubleshooting

- Firebase Auth issues: verify `.env.local` values and Firebase console settings (Auth providers, OAuth redirect URIs).
- Popup/COOP issues during Google sign-in: some browser/environments block popup-based OAuth when COOP/COEP headers are set; the app falls back to redirect-based sign-in. If you see a console message mentioning Cross-Origin-Opener-Policy, try the redirect flow.
- Balance not updating: ensure real-time listeners are active and the `wallet:profile-updated` / `wallet:transaction-*` events are dispatched by services after changes.

---

## 🤝 Contributing

Contributions are welcome. Typical workflow:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Make changes and add tests if applicable.
4. Run lint and build: `npm run lint && npm run build`.
5. Open a pull request.

See `doc/CONTRIBUTING.md` for more details.

---

## 📄 License

MIT — see the `LICENSE` file.

---

If you'd like, I can also:

- Add CI badges (build/test/deploy) to the README.
- Insert an actual screenshot image under `public/img/demo.png` and point the preview to it.
- Run a Markdown preview/linter and fix any remaining issues.

Tell me which of the above you want next and I'll do it.
