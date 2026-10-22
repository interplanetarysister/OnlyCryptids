# Only Cryptids

A cryptid creator community operated by **Interplanetary Association**. This is a work in progress, not a launch-ready marketplace.

Base44 app: https://only-cryptids-69c8c9fb.base44.app

App ID: `6ad9e37246a8642469c8c9fb` — Unrewound's Workspace. The deployed app has workspace visibility and uses Base44 authentication. Source is managed with the CLI; linking a GitHub repository in Base44 remains pending.

## Implemented

- Original responsive forest-themed feed, search/filter discovery, creator profiles, studio, saved/following screens, and fictional demo illustrations.
- Backend-mediated profile, text-post/draft, comment, follow, like, bookmark, report, copyright-complaint, and administrator moderation operations.
- Seventeen authored entity schemas deny direct client CRUD (fourteen are in the previous deployment). Subscriber bodies require a verified, unexpired entitlement; no client operation grants paid subscriptions.
- Cryptid forums with labeled discussions, paginated replies, upvote toggling, report intake and administrator moderation.
- Mutual signed-in creator blocking, unblock management and notification read controls.
- Required versioned copyright-assignment review/signing and downloadable agreement copies. Signing and publishing remain disabled until the operator completes and activates the legal configuration. No real signatures have been collected.
- Researched cryptid content briefs, story-to-image prompt preparation, draft subscription/service-credit options, merchandise previews and donation setup information. These screens do not charge or invoke generation providers.

## Latest changes awaiting deployment

- Forum discussions/replies/upvotes, reporting and moderation; three new private entity schemas.
- Creator blocking enforced on feeds, content reads, follows, comments and forum interaction; Settings includes unblock controls.
- Notification read actions verify ownership and the badge counts unread items.

- Comment authors, the post owner, and administrators can remove a visible comment; other accounts cannot. Removal is audited and preserves the record with a removed status.
- Deleted posts are omitted from the studio and cannot be opened or edited.
- Successful text-post saves and sign-out clear the local session draft.
- Draft Terms now identify Interplanetary Association and refer to the separate assignment instead of contradicting it.
- Proprietary source notice, repository exclusions, and isolated authorization checks are included.

This source passed the production build and thirty isolated authorization/forum checks, including valid signed publishing, cross-account denials, blocking, reply removal, reporting, moderation, notification ownership and forum pagination. Deployment is pending renewed Base44 CLI authentication. The connected Base44 tool confirms this app is externally managed and rejects sandbox operations with UNMANAGED_SOURCE_CODE; a GitHub upload alone does not deploy the app or establish Base44 source sync. GitHub source repository: https://github.com/interplanetarysister/OnlyCryptids. The source upload uses the connected GitHub account. The repository is public; its proprietary source notice does not make the source private. No Actions workflow is included. Linking this repository as Base44’s source is still pending.

## Development

```sh
npm ci
cp .env.example .env
npm run dev
node scripts/check-access.mjs
npm run build
```

Set `VITE_BASE44_APP_ID` to the app ID to connect the frontend. This ID is public; never place secrets in a `VITE_` variable. Without it, the app runs a read-only design preview with clearly fictional sample content. Authorization checks run with an isolated fake database and make no external calls.

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

The user-confirmed operator and intended assignee is **Interplanetary Association**. Covered original submissions transfer only under an explicit signed assignment. Creator attribution and contractual earnings remain; excluded third-party rights, public-domain folklore, facts, ideas and noncopyrightable AI output do not become exclusive property. No existing signature or business-category monopoly is claimed.

See `LICENSE`, `docs/requirements.md`, `docs/cryptid-content-research.md`, `docs/platform-rights-and-enforcement.md`, and `docs/Creator-Copyright-Assignment-DRAFT.txt`. Dependencies retain their own licenses. External Google Fonts are referenced by the stylesheet; review privacy/licensing before launch. Secrets, local CLI identity, generated output and temporary authentication wrappers are excluded by `.gitignore`.
