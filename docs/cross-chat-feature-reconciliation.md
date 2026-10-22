# Only Cryptids cross-chat feature reconciliation — 2026-10-22

This is a release checklist, not a claim that every item is active on the public website. Owner-directed features are tracked separately from exploratory mockups. Do not activate billable integrations or spend developer/AI credits without a cost-specific approval.

## Implemented in repository; live deployment must be separately verified
- Cryptid-themed creator and discovery interface with mobile navigation, category/subcategory selection, public teaser and full-body entitlement separation, bookmarks and follows.
- Member free posting and comments; platform reporting; shareable links; Reddit-inspired communities and moderator controls.
- Platform-owned editorial creator profiles, clearly marked fictional examples, owner beneficiary designation on platform supporter offers.
- Cryptid map using OpenStreetMap/Leaflet: self-reported public pins linked to firsthand stories, rounded approximate coordinates by default, category filters, loaded-results place/title search and list fallback.
- Preliminary 1–5 footprint *editorial quality* ratings, source-context notes, AI/fiction/claimed-encounter labels; no unsupported authenticity probability.
- Suffering unit catalog (1=$0.25), manual 30-day subscription offers and premium-post quote calculation, no live checkout.
- Explicit creator copyright-assignment workflow and draft legal documents; publishing eligibility depends on real verified signature and approved operator terms.
- Feed ordering by newest, oldest and preliminary editorial-quality score (not popularity or truth probability).

## Must remain blocked until verified (not complete)
- Public deploy parity: anonymous front door, proper visitor content projection, signed-in member/admin routes, production function migrations and domain propagation.
- Passkey authentication: use supported hosted WebAuthn provider with server-side challenge, relying-party domain verification, counter/credential checks, account recovery; do not fake it in the browser. Free member login must not require monetization MFA.
- Administration: remotely verify role assignment for remotebetrayal@gmail.com; email alone is not role proof.
- Media: safe upload size/type validation, malware safeguards, image metadata stripping, original rights, storage access rules, authorized subscriber delivery, video/audio capacity and delete/retention paths.
- Finance: PayPal account linking/marketplace eligibility, signed webhooks, reconciliation, atomically funded Suffering wallets, renewals, refunds, creator payouts, financial and tax/legal review; quotes cannot grant access.
- Monetization-only MFA enrollment via supported identity provider; never set `verified` from the client.
- Paid AI creation/agent grading: provider key and cost controls, provenance labelling, moderation and human appeals; no fabricated witness statements or invented evidence.
- Creator shop, licensed merchandise, live streaming, direct messaging, promotional donations/wallets and subscription renewals remain future work unless individually verified end to end.
- Real-time opt-in notifications, creator/media privacy export/deletion, legal review, moderation appeals/abuse rate limits and production load tests.

## Nonnegotiable product decisions
- Only Cryptids admin operator requested: remotebetrayal@gmail.com, but must use verified server role.
- Editorial creators belong to the platform; their subscription proceeds are earmarked for moderation. Independent creator entitlements and payees stay distinct.
- Free members may post and comment without payment or extra monetization verification.
- Allow links in posts/comments subject to abuse controls, and reporting directly to the platform.
- Copyright and cryptid provenance must not imply ownership of folklore or authentic verification of sightings.
- Explicitly identify simulations/placeholders and keep billing/financial operations disabled until real.
- Base44 canonical app 6ad9e37246a8642469c8c9fb, repository interplanetarysister/OnlyCryptids. Do not create duplicates or use builder credits unnecessarily.
