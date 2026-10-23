# OnlyCryptids — host migration readiness audit (2026-10-23)

**Conclusion: SOURCE PRESENT; INDEPENDENT MIGRATION NOT YET READY.** A static frontend can be rebuilt from GitHub, but a fully functional new-host OnlyCryptids installation cannot be reconstructed solely from this repository.

**Repository:** https://github.com/interplanetarysister/OnlyCryptids (public; use `main` for the last Base44 checkpoint). The `feature/onlycryptids-ai-memberships` branch has separate history and should not be blindly merged into main. Verify code differences before any merge.

## Verified source in GitHub main

- `index.html`, `src/main.jsx`, `src/App.jsx`, `src/style.css` and component source: present.
- `src/AIStudio.jsx`, `src/Commerce.jsx`, `src/SufferingLeaderboard.jsx`, social, map, forum, creator, login and content UI: present.
- `base44/functions/cryptid-api/entry.ts`, `index.ts`, `function.jsonc`, `ai-actions.js`, `economy.js`, `creator-finance.js`, `leaderboard.js` and helpers: present.
- `base44/entities/*.jsonc`: versioned schema definitions (NOT actual live records).
- `package.json`, `package-lock.json`, `base44/config.jsonc`, `.env.example`, `.gitignore`: present. Package dependencies match the lockfile root dependencies.
- Legal/product documentation and isolated test scripts: present, including AI, social, and creator-payout setup guides.
- On the matching Base44 workspace commit `ed414e34fb6b5e96335e82326dc67d270b4049ad`, the no-credit checks passed: 22 unit tests, 95 simulated API permission scenarios, 6 internal-link checks and Vite production build. These do not establish a new-host live runtime.

## Critical portability blockers

1. **The browser is coupled to Base44.** `src/api.js` imports `@base44/sdk`, creates a Base44 client, and invokes Base44 function `cryptid-api`; the app defaults to a Base44 app ID. A static build deployed elsewhere may still depend on Base44 and may have auth/CORS or redirect restrictions. It is NOT an independent migration.
2. **The server is coupled to Base44.** `entry.ts` and `index.ts` use `npm:@base44/sdk`, `createClientFromRequest`, `client.auth.me()`, `client.asServiceRole.entities`, app-user connector sessions, Base44 password login, and `Deno.serve`. A new host needs its own authenticated, service-only API implementation or a rigorously tested compatible adapter. Do not replace server authorization with client-side checks.
3. **Auth users and app data are not versioned.** The built-in `User` entity, password/auth identity, roles, creator/post records, signatures, moderation data and internal IDs live in Base44 and cannot be reconstructed from committed JSON schemas. Migrate them privately through provider-authorized exports and preserve relationships. Do not place account exports, password hashes, emails or signed agreements in this PUBLIC repository.
4. **No target-host backend/database/auth/storage configuration exists.** There is no independent DB schema migration/seed for a new database, API runtime wiring, deployed authentication provider, media storage wiring, host secrets provisioning, or tested production deploy for another provider.
5. **Live third-party services are not portable by copying source.** PayPal merchant approval, payment webhooks, creator seller onboarding, payouts, Meta connector authorizations, AI generation provider credentials and app-user OAuth grants must be separately set up or reauthorized. Paid checkout/payouts/AI and Suffering wallet are currently disabled.
6. **Case-insensitive filename collisions.** There are seven pairs of entity schema filenames with the same case-folded path: `Comment/comment`, `Creator/creator`, `Interaction/interaction`, `Notification/notification`, `Post/post`, `Report/report`, `Subscription/subscription`. The mixed-case files declare the same entity names but several lowercase copies omit fields. They can conflict when cloning on a default macOS/Windows filesystem and must be reconciled before calling a schema import canonical. The backend code uses capitalized entity names; still verify deployment semantics before removing old files.
7. **Canonical URL and domain references.** Frontend content links and server social sharing contain `onlycryptids.base44.app` links. Set up an owner-controlled new domain, redirects, callback URLs, and canonical content URLs; a `*.base44.app` host is not owned independently of Base44.
8. **Media is not bundled.** The UI's illustrated scenes are generated with CSS; no binary user-upload archive is included in the repository. User media must be copied through permitted private storage exports when it exists. Test object-access rules and signed/private media links.
9. **Operational readiness is incomplete.** Real authorized account flows, onboarding, subscription lifecycle, webhook idempotency, settled payouts, reporting, legal agreements, moderation, audit retention, backup/restore and host production smoke tests remain required before moving real users.

## Current Base44 data inventory (read-only count query, 2026-10-23)

| Entity | Current records |
|---|---:|
| User | 2 |
| Creator | 3 |
| Post | 3 |
| CreatorPlan | 3 |
| PlatformSettings | 1 |
| Comment | 0 |
| MediaAsset | 0 |
| Subscription | 0 |
| PaymentEvent | 0 |
| CreatorEarning | 0 |
| CreatorPayout | 0 |
| CreatorPayoutProfile | 0 |
| ContestRating | 0 |
| AIMembership | 0 |

These are live Base44 record counts at the time of inspection, **not records included in GitHub**. Other entities were not exhaustively counted. Re-query and perform integrity checks at cutover.

## Environment and secret inventory

Public frontend configuration: `VITE_BASE44_APP_ID`, `VITE_ONLYCRYPTIDS_PREVIEW`. Those values are NOT a full new-host deployment configuration. The backend references `ONLYCRYPTIDS_PAYPAL_MERCHANT_ID` plus connector ID keys `CRYPTIDS_FACEBOOK_PAGES_APP_USER_CONNECTOR_ID` and `CRYPTIDS_INSTAGRAM_APP_USER_CONNECTOR_ID` via its Meta platform mapping. These are pointers to Base44 integrations, not replacements for authorized OAuth tokens.

**Never commit** PayPal API credentials, webhook signing secrets, provider tokens, AI API keys, browser sessions, user-password exports, PII, or real ledger/data dumps. Create target-specific secrets only in the new host's private secret manager. Merchant email is not provider authorization.

## Two possible migrations

### A. Rehost only the frontend (still uses Base44)

1. Clone main and run `npm ci && npm test && npm run build`.
2. Publish the built `dist/` directory on a static host.
3. Continue using `VITE_BASE44_APP_ID` and the existing Base44 backend *only if* the signed-in browser flow, function calls, allowed origins and callback redirects work on the new domain.
4. Smoke-test sign-up, sign-in, username login, browsing, posting, authorization, privacy, and external sharing. Billing remains inactive.
5. **Do not delete or retire Base44**: it still owns the backend, users, and data.

### B. Fully independent migration (the user's likely intended end state)

1. Select a target host, managed auth system, transactional database and private media store (prefer no-credit or free-tier services).
2. Design target schema migrations and unique indexes; resolve the seven case collisions; preserve IDs and sensitive permission semantics. Review **every** entity, including app-built-in `User`.
3. Implement a replacement API adapter for the `src/api.js` surface and port `cryptid-api` with server-side ownership, moderator/admin permissions, premium visibility checks, audit logs, and provider isolation.
4. Configure signup/email verification/account recovery and a secure transition for existing Base44-authenticated users. Do not attempt to extract existing passwords or impersonate accounts.
5. Export all Base44 production records and allowed media through authenticated provider APIs to a **private encrypted migration staging area**, map foreign keys, import to the new system, compare record counts and run referential-integrity and content-access tests.
6. Reconnect approved social, PayPal and AI integrations from the owner-approved provider applications; never enable charges/withdrawals before verified receipts and a transactional ledger exist.
7. Prepare new-host deploy files, private environment variables, owned domain/callbacks, TLS, backups, logs and rollback strategy. Test web and mobile UX on the real host.
8. Run a parallel verification period. Perform a controlled final data sync/freeze/cutover only after parity and owner approval. **Do not shut off Base44 first.**

## Evidence and caution

This is a source and data-inventory audit, not a successful external deployment or claim that hosted authenticated flows work. Base44's sandbox was clean at the matching checkpoint and a direct build succeeded there. A host-independent backend, complete secure data export, new provider integrations, and real end-to-end tests remain outstanding.
