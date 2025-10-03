# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `src/app`, with feature folders such as `admin`, `event`, and `participant` plus API routes under `api`. Shared UI sits in `src/components`, reusable logic in `src/lib` (Firebase analytics, validation, contexts), and typed contracts in `src/types`. Static assets ship from `public`, while `scripts/generate-icons.js` maintains PWA icons. Store environment secrets in `.env.local` and review the Firebase setup guides in the repo root before deployment work.

## Build, Test, and Development Commands
- `npm run dev`: start Turbopack dev server with hot reload.
- `npm run build`: compile an optimized production bundle; run before deploys.
- `npm run start`: serve the built app locally for smoke tests.
- `npm run lint`: execute ESLint across the project.
- `node scripts/generate-icons.js`: regenerate icon assets after branding changes.

## Coding Style & Naming Conventions
Write TypeScript function components with two-space indentation, single quotes, and trailing commas—the ESLint config enforces those defaults. Use `PascalCase` for components/hooks, `camelCase` for utilities, and `UPPER_SNAKE_CASE` for constants. Prefer Tailwind classes for styling and keep global overrides in `src/app/globals.css`. Guard browser-only APIs behind client components or effect hooks to stay server-render compatible.

## Testing Guidelines
Automated tests are not yet configured, so every PR must document manual verification steps and include screenshots for visible UI changes. Structure future unit or integration tests alongside the relevant code as `*.test.tsx` files and wire new commands into `package.json`. Always run `npm run lint` and `npm run build` before requesting review to catch regressions early.

## Commit & Pull Request Guidelines
Commit messages follow the short, imperative style already in history (e.g. “Fix SSR errors: wrap useSearchParams in Suspense”). Keep subjects under ~65 characters and add bodies only when context is necessary. Pull requests should reference issues, summarize risk, and call out required environment or Firebase changes. Include before/after screenshots when touching UI and note any manual test plan you executed.

## Firebase & Configuration Tips
Firebase config files (`firebase.json`, `firestore.rules`, `firestore.indexes.json`) must stay in sync with any backend change. Use the repository guides (`FIREBASE_SETUP_GUIDE.md`, `firebase-setup.md`) when rotating credentials and never commit secrets—add them to `.env.local` instead. When introducing new indexes or rules, describe the required deployment steps in your PR.
