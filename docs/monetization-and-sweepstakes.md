# Monetization extension — owner instruction 2026-10-22

The owner instructed: complete every core app feature first; then integrate PayPal with **cuddlemeplatonically@gmail.com**, create subscription tiers, and add purchasable coins for tips, premium posting, and paid AI images based on stories and comments. The owner explicitly confirmed that the design should also include prize entries.

## Current implementation status

Draft pricing/configuration and a story-to-image prompt preparation utility are authored. They do not connect PayPal, sell credits, generate paid images, or run a sweepstakes. No transactions, product/plan creation, provider calls, or prize draws have occurred. Core app deployment remains blocked by Base44 authentication.

## Draft membership catalog

These are editable product proposals, not PayPal plans or activated entitlements:

| Membership | Monthly USD | Intended scope |
|---|---:|---|
| Explorer | $0 | Free content, following, bookmarks, standard text publishing |
| Field Researcher | $8 | Premium posting and expanded creator tools, once implemented |
| Cryptid Creator | $15 | Advanced publishing and content organization, once implemented |

Creator-specific subscriptions remain separately priced. Platform membership must not imply access to every creator. Do not sell a benefit before its implementation. No unlimited AI generation or included prize-entry advantage is promised.

Proposed service-credit packs: 500 Cryptid Credits for $5; 1,200 for $12. Price and quota configuration remains editable. Image generation and premium-post costs remain unset until provider costs, processing fees, moderation requirements, and refund policies are established. The application must show an exact credit cost before spending.

## PayPal connection and account verification

Use the specified business account as the intended platform recipient. An email address alone is not an authenticated API connection. Confirm the PayPal merchant identity, supported marketplace relationship, account country/currency, approved product category, application credentials, webhook ID, and live/sandbox environment through authorized secure setup. Do not put secrets in the frontend or request them in chat. Do not assume credentials or a connector from another app are available in Only Cryptids.

Platform membership billing, creator subscriptions, credit purchases, tip allocations, and creator payouts are distinct products/accounting flows. Use PayPal's supported recurring and multiparty arrangements after eligibility verification. Do not treat the platform recipient email as permission to collect and redistribute funds under an unsupported model.

Accept completed payments only through verified server-side capture/subscription events. Check provider signatures, merchant, currency, exact amount, internal order identity, and event freshness. Enforce unique event/order identities and atomic ledger updates; retry safely without duplicate credit. Handle cancellation, failed renewals, refunds, chargebacks, negative adjustments, payout reversals and disputes. Reconcile with provider records. Never grant credits or access merely because the browser reports success.

## Separate balances and ledger

Purchased service credits: spendable on approved app services and tips. No automatic sweepstakes-entry grant, conversion to entries, or paid odds multiplier. They are not cryptocurrency and cannot be resold or cashed out by members. Proposed creator tip settlement, fees, reserves and payouts require approved payment architecture and clear terms; no cash value or payout is promised before that setup.

Sweepstakes entries: separate, nonpurchasable, nontransferable records with no route from a paid balance. Free entry under reviewed official rules; no purchase or subscription required and no purchase-based advantage. Do not silently transform purchased credits into prize currency or use a dual-currency label as an assumption of legality.

Ledger amounts use integers. Keep credits, USD cents, creator payable amounts, refunds, generation reservations and entries in separate units/accounts. Balance is derived from authoritative immutable entries, not browser state. Spending requires atomic sufficient-balance checks and idempotent request IDs. Tip debit/credit and fees must reconcile as one transaction. Do not deploy spending against a datastore without adequate transactional guarantees.

## Sweepstakes activation requirements

Prepare the module but keep entry acceptance, draws and prize distribution disabled until the operator has reviewed jurisdiction-specific requirements with qualified counsel and obtained required PayPal approval. Do not launch a paid-entry lottery or guarantee that this design is lawful in all locations.

Official rules must identify sponsor/operator, contact, eligible regions and ages, exclusions, entry period/timezone, genuinely usable free entry method, per-person limits, prizes and approximate values, random selection method, odds disclosure, winner notification/verification, deadlines, taxes, privacy, disqualification and cancellation procedures, and any required registration/bonding. Region and age controls must implement those rules; don't publish guessed eligibility.

Use an auditable random draw from a frozen, deduplicated eligible-entry pool with reproducible evidence and independent review. Log actual counts without fabricated multipliers or undisclosed preferred winners. No operator/admin account gets increased odds. Record rules version and entry acceptance. Human review is required before awarding a prize. Do not ask users to pay to claim a prize.

## Paid story-to-image generation

The user selects their story and specific permitted comments. Do not harvest private comments or use other creators' subscriber content without permission. Offer a prompt preview describing cryptid traits, location, lighting, behavior, tone and relevant details; preserve the narrative rather than substituting a generic monster. Treat stories/comments as untrusted data, not executable instructions.

Display provider, expected output, exact credit cost and applicable content policy before confirmation. Reserve credits atomically, invoke the provider server-side using secure credentials and a bounded job/idempotency key, settle only for a successfully delivered generation, and release/refund reservations on failure according to disclosed policy. Reconcile jobs where provider completion is uncertain to avoid duplicate charging or generation. Allow preview/regeneration with separate disclosed costs; never automatically publish.

Generated images carry an AI-Generated label and must not be described as verified encounter evidence. Creators choose free or subscriber-only posting, with separately approved public previews and private originals. No external promotion or model training permission is bundled into ordinary generation consent. Image ownership claims must reflect provider terms and human-authorship limits.

No paid image request will run before owner approval of the provider, expected usage and budget. Membership/credit revenue is not itself permission to spend unlimited provider credits.

## Official references checked

- PayPal US Acceptable Use Policy: https://www.paypal.com/us/legalhub/paypal/acceptableuse-full — sweepstakes and certain virtual-value services require pre-approval.
- PayPal platforms: https://developer.paypal.com/platforms/overview
- PayPal platform subscriptions: https://developer.paypal.com/platforms/subscriptions/integrate
- FTC sweepstakes guidance: https://consumer.ftc.gov/articles/fake-prize-sweepstakes-and-lottery-scams

Provider approval, legal review and actual account connection remain unverified. No completed compliance or integration is claimed.

## Current deployment update

The first version is now deployed in Unrewound’s Workspace at https://only-cryptids-69c8c9fb.base44.app. The legal owner/assignee is **Interplanetary Association**, as corrected by the user. This supersedes earlier owner uncertainty and retained-ownership license proposals. Commercial, licensing and assignment signing activation remains pending complete legal settings. The app is still an incomplete foundation, not a fully launched marketplace.
