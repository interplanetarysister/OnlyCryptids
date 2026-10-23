# OnlyCryptids · AI Storykeeper and PayPal AI memberships

**Status (October 23, 2026):** Feature branch implementation, not deployed and not enabled for payment or provider usage. No PayPal product, plan, subscription, API key, charge, or model generation has been created in an external account.

## Scope and prices

OnlyCryptids membership is independent from Interplanetary Fund and independent from subscriptions to individual creators.

| Draft plan | Monthly price | Entitlement |
| --- | --- | --- |
| Explorer | Free | Ordinary content reading and posting; no AI generation |
| Field Researcher | $8.00 | Cryptid stories, image-to-story, spelling/grammar/story improvements |
| Cryptid Creator | $15.00 | Field Researcher capabilities plus original AI artwork |

The rates originate from the existing draft platform-tier catalog, not an owner-approved live PayPal price. They are proposals and must be confirmed before billing begins. Generated text/images are never automatically published; users must review, confirm rights, and label AI work. There are no promises of unlimited usage; accurate per-plan allowances, cancellations, refunds and overages must be displayed before selling.

**Intended platform merchant:** `cuddlemeplatonically@gmail.com`. The email is not a PayPal business connection or verified merchant ID. Required provider-owned business ID and credentials must be obtained using authorized secure PayPal onboarding. Do not re-use the IFund plan/account entitlement to unlock OnlyCryptids.

## Current code

- `onlycryptids-ai.js` is the versioned editorial/persona/style and draft-plan contract.
- `ai-actions.js` adds `ai-catalog`, `ai-preferences`, `ai-preferences-save`, `ai-brief`, `ai-generate`.
- `AIMembership` is service-role-only; entitlements require verified PayPal status, exact merchant ID, OnlyCryptids scope and unexpired subscription.
- `AIPreference` is service-role-only; members can opt in/out of using excerpts from their own published non-AI posts for future writing context.
- `src/AIStudio.jsx` offers plan comparison, genre preferences, protected names, local image selection/preview and cost-free editorial brief creation.
- Image selection currently stays on device. No image pixel analysis occurs. Live image upload and image-to-story generation require a private-media pipeline.

The UI explicitly says checkout and generation are not active. Backend deliberately fails closed with HTTP 402 for missing verified entitlements and 503 for not-yet-provisioned model inference.

## PayPal deployment requirements (in order)

1. Verify account ownership, country/currency, business permissions and eligibility for subscription digital content on the **OnlyCryptids** merchant. Establish sandbox separate from live.
2. Configure PayPal REST OAuth client/secret and **merchant ID** as server secrets; do not commit them, send them to the browser, or place them in source. Required variables include `ONLYCRYPTIDS_PAYPAL_MERCHANT_ID`, plus future environment-scoped credentials and webhook ID.
3. Create a subscription catalog product, then two monthly billing plans through the **Subscriptions API** after rates, trial policy, AI allowances, tax handling, cancellation/refund terms and merchant identity are approved. Store exact provider plan IDs in server config, never trust client-supplied plan IDs.
4. Issue an authenticated, user-bound, idempotent checkout/order from the server; use PayPal subscription approval. The approval redirect is **not** proof of payment.
5. Deliver webhook events to a separate HTTPS endpoint with PayPal signature verification against configured webhook ID, timestamp/replay checks, environment verification and event-ID deduplication. Match merchant, PayPal plan, user-bound subscription, currency and amount to records.
6. Reconcile **PAYMENT.SALE.COMPLETED**, subscription activation, failed payments, suspension, cancellation, expiration, refund, reversal and disputes against PayPal API. Only then create/update `AIMembership`. Grant access only for the paid-through entitlement window and revoke appropriately. Use a datastore with transactional event and ledger uniqueness.
7. Add subscription management, upgrade/downgrade and cancellation links, billing receipts and clear renewal disclosures. Test sandbox lifecycle including replay, out-of-order events and chargebacks before enabling live checkout.
8. Add owner-approved AI inference gateway (server-side only), encrypted private uploads, abuse guards and transactional per-user monthly quotas. Confirm model, price per image/story, maximum output size, monthly cost ceiling, failure refunds and image moderation before activating AI features. No extra billable provider usage without renewed authorization.

Official documents:
- PayPal subscription integration: https://developer.paypal.com/platforms/subscriptions/
- Subscription webhook event catalog (current September 2026): https://developer.paypal.com/subscriptions/webhooks/
- Webhook signature verification: https://developer.paypal.com/api/rest/webhooks/rest/
- Show and verify subscription details: https://developer.paypal.com/api/subscriptions/v1/subscriptions-get/

## OnlyCryptids signature editorial standards

- **Text:** vivid professional craft, compact hook, atmosphere, sensory specificity, disciplined pacing, local details, intensifying dread, unsettled endings, varied rhythm, powerful but precise vocabulary.
- **Subject:** cryptids, unexplainable phenomena, unusual sightings, unsettling ghost stories, odd artifacts, lost signals, folklore and unsolved mysteries. Stay faithful to the user's supplied information rather than replacing it with popular tropes.
- **Spelling:** correct ordinary spelling, punctuation and grammar automatically when provider generation is active; preserve invented proper names, cryptid species, regional names and deliberate dialect. The explicit protected-terms list is an additional safeguard.
- **Art:** cinematic graphic-novel realism, believable silhouettes, precise sharp inks, layered atmospheric shadows, detailed environments, polished movie/comic/magazine quality. Multiple house-presets are available.
- **Truth:** label AI art, never claim a generated illustration is photograph/evidence; do not fabricate verifiable lore, authentic sightings or citations; respect context of sacred/indigenous traditional stories.
- **Learning:** explicit opt-in personalization from each member's own public writing and chosen themes, under their own account only. Do **not** train on posts without separate consent, access other users' private writing, or assume engagement equals informed training permission. Aggregate anonymized trends would require its own design and consent review.

## Verification

Use `node --test scripts/ai-policy.test.mjs`. Test browser preview, opt-in saving, feature restrictions and backend failure states after deploying schema/functions to a test environment. Do not run metered provider calls or GitHub Actions minutes without approval.
