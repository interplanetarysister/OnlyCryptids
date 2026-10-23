# Only Cryptids

> **Hosting migration status (2026-10-23): source present, independent-host migration not yet ready.** The frontend, Base44 backend source, schemas and tests are versioned here, but authentication, live entity records, backend runtime, provider connections and payout verification remain Base44-/provider-specific. See [the verified host-migration audit](docs/HOST_MIGRATION_READINESS.md) before cloning to a new provider. Do not commit private user exports or API keys.

A cryptid creator community operated by **Interplanetary Association**. This is a work in progress, not a launch-ready marketplace.

Base44 app: https://only-cryptids-69c8c9fb.base44.app

App ID: `6ad9e37246a8642469c8c9fb` — Unrewound's Workspace. The deployed app has workspace visibility and uses Base44 authentication. Source is synchronized through GitHub and the connected Base44 editor.

Next sprint: [docs/next-build-sprint.md](docs/next-build-sprint.md). Current visitor address: https://onlycryptids.base44.app/login (sign-in wall observed; signed-in runtime is unverified).

## Encounter map

The Encounter map navigation page uses Leaflet and OpenStreetMap standard tiles (no Google API key, billing account or paid geocoding). Members select one of their published Claimed Encounter stories, choose a point or enter coordinates, add a date/place and explicitly confirm firsthand/public sharing. Approximate mode rounds to 0.1° before storage; exact mode is optional. Pins show only public teasers and story links, with paid story access still enforced. Fiction/AI labels, hidden/deleted/draft stories and suspended authors are excluded. Relabeling/unpublishing removes the pin. Members can remove their pins; administrators can hide the source story through existing reporting. No fake encounter pins are seeded.

OSM tiles require attribution, normal browser referrer/caching and no bulk prefetch/offline downloads. Tile availability is best-effort; the story list and coordinate form remain usable on tile failure. Tiles are requested only while the map page is open; there is no automatic geolocation or address search. Review provider capacity before large-scale launch. https://operations.osmfoundation.org/policies/tiles/

## Current implementation

- Original creator/member feed, cryptid categories and subcategories, public teasers, protected subscriber/premium bodies, profiles, bookmarks, follows and moderation.
- Any authenticated member can publish through a member profile; the backend creates that profile on the first post when necessary. No creator subscription or monetization MFA is required for free posts/comments. The separately required copyright-assignment consent still applies to original member submissions, and its legal configuration must be completed before member publication opens.
- Username-or-email/password sign-in, with usernames configured in member Settings. Base44 still requires its initial email verification on signup; this is separate from repeated sign-in MFA. Passwords stay with the authentication provider and are not saved by Only Cryptids.
- Paginated post comments and replies, safe clickable internal links, shareable post/thread/community URLs, and direct reports to platform staff.
- User-created communities, membership/rules, threaded discussions, upvotes/downvotes, owner-appointed moderators, report queues, lock/pin/remove controls, and bans. Moderator permissions are scoped to the community. Platform escalations are excluded from community moderator queues.
- Creator subscription-offer creation/editing, 30-day access descriptions, pause/list status, separate premium-post prices, and authoritative purchase quotes. Every offer unlocks that creator's general subscriber posts; the description is not a separate tier-specific content entitlement. Individual premium posts cost extra. Renewal is manual in this version.
- **Suffering: 1 unit = $0.25 USD.** Packs: 4/$1, 20/$5, 40/$10, 100/$25. The name/rate are centralized. Purchased credits do not buy sweepstakes entries or improve prize odds. Quotes never debit a balance or create an entitlement.
- **The Pine Watch**, **Midnight Moth**, and **Beneath the Surface** are platform editorial profiles owned by Interplanetary Association. Their introductory posts are original fiction, not fabricated eyewitness reports. Administrators can post/edit for these profiles; ordinary members cannot impersonate them. Subscription revenue from these profiles is designated for the platform owner to support moderation. Independent creators retain their separate beneficiary designation.
- A monetization-only gate requires a verified, short-lived MFA session before active paid offers or paid publication. Enrollment/provider verification is not connected yet, so paid activation is blocked; paused offers remain configurable. No client action can mark itself verified.
- Twenty-two canonical entity definitions deny direct client CRUD. Verified paid entitlements are read server-side. Purchases fail closed while funding and atomic credit accounting are inactive.

## Saved source and live status

GitHub: https://github.com/interplanetarysister/OnlyCryptids

Base44's connected editor now reads the actual repository source. The three editorial profile records and their free fiction introductions have been converted in the remote app data. The batch is saved in the connected Base44 sandbox and checkpoint `6ada2a3829e4b73c31c6c089` at commit `410285becb15530ebcea4c68d3080bbc31760ceb`. Its production build, 64 isolated API scenarios and six internal-link checks passed there. The hosted backend still returned the older API during runtime verification, so live deployment is not confirmed. Public publication is a separate step. Three paused platform supporter offers are saved at 20, 16 and 24 Suffering per 30 days; each designates Interplanetary Association as beneficiary for moderation costs.

The source passes the production build and focused isolated API/link checks. Tests use a fake database and make no authentication-provider, payment or generation calls. Real checkout, credit funding/spending, automatic renewals, creator payouts, AI generation, merchandise sales, and MFA enrollment are not active. No real customer payment or test entitlement has been created.

## Development

```sh
npm ci
cp .env.example .env
npm run dev
node scripts/check-access.mjs
npm run build
```

Set `VITE_BASE44_APP_ID` to the app ID to connect the frontend. This ID is public; never place secrets in a `VITE_` variable. The verified public app ID is also the default in the client, so ordinary Vite/GitHub builds connect correctly. Set `VITE_ONLYCRYPTIDS_PREVIEW=true` for a read-only editorial design preview. Authorization checks run with an isolated fake database and make no external calls.

After authenticating the official Base44 CLI and verifying the workspace/app identity, deploy with `BASE44_DISABLE_TELEMETRY=1 npx base44 deploy --build --yes`. Do not create another app or invoke the AI builder just to update this source. No GitHub Actions workflow is included. The installed official CLI supports `BASE44_DISABLE_TELEMETRY=1`; set it on CLI authentication and deployment commands to prevent optional PostHog analytics requests.

## Launch work remaining

- Media upload validation, metadata stripping, private storage, authorized delivery, transcoding, previews, avatar/cover uploads, and media management. File selection currently explains that storage is not configured.
- PayPal account connection, marketplace approval, secure webhooks, event idempotency, subscription lifecycle, cancellation/refunds, payouts, and billing management. Checkout remains disabled.
- Real paid AI generation, moderation, quota accounting and provider cost limits. Current tools prepare prompts only.
- Shop fulfillment, product publishing, consent/rights eligibility, featured-content rankings, creator earnings statements and payouts. Revenue shares and prices remain draft proposals.
- Wallet/donation provider integration. No private keys are collected.
- Separate free sweepstakes entry system and service-credit ledger. Prize transactions and purchased-entry benefits are disabled pending legal/provider review.
- Production feed pagination, abuse limits, database-enforced uniqueness/idempotency, notification generation/preferences, account export/deletion, full revisions, and preview/content-warning controls. Forum pagination uses capped offset pages; concurrent votes and handles still require database-enforced uniqueness before using rankings for earnings or awards. Blocking applies to signed-in content access and new interactions, does not cancel subscriptions, and does not make public content private.
- Published member terms, legal address/contact/jurisdiction, approved assignment terms and revenue share, copyright notice/counter-notice operations, retention/backups, and operational security review.

## Ownership and dependencies

The user-confirmed operator and intended assignee is **Interplanetary Association**. Covered original submissions transfer only under an explicit signed assignment. Creator attribution and contractual earnings remain; excluded third-party rights, public-domain folklore, facts, ideas and noncopyrightable AI output do not become exclusive property. No existing member signature or business-category monopoly is claimed.

See `LICENSE`, `docs/requirements.md`, `docs/cryptid-content-research.md`, `docs/platform-rights-and-enforcement.md`, and `docs/Creator-Copyright-Assignment-DRAFT.txt`. Dependencies retain their own licenses. External Google Fonts are referenced by the stylesheet; review privacy/licensing before launch. Secrets, local CLI identity, generated output and temporary authentication wrappers are excluded by `.gitignore`.
