# OnlyCryptids creator subscriptions and withdrawal launch gate

**Current status (2026-10-23): NOT LIVE.** The feature branch and Base44 workspace include read-only `earnings-summary`, server-only `CreatorEarning`/`CreatorPayout`/`CreatorPayoutProfile`, disabled `payout-request`, a Creator studio earnings panel, and synthetic tests. No PayPal payment, account link, payout or real credit was created.

## PayPal setup

Business operator: `cuddlemeplatonically@gmail.com`. The address is not a connected API merchant identity, OAuth token or payout authorization.

1. Obtain approval for **PayPal Complete Payments Platform** if marketplace seller onboarding and multi-party Checkout is required. Docs: https://developer.paypal.com/platforms/get-started and https://developer.paypal.com/platforms/seller-onboarding .
2. Obtain **Payouts** eligibility if the platform will collect and later disburse owed creator earnings. Docs: https://developer.paypal.com/payouts/overview/ . Do not represent the marketplace as approved before PayPal says so.
3. Create PayPal sandbox REST credentials; store the client ID, secret, webhook verification configuration and your returned merchant ID **only in server secret management**, never in frontend code or Git. Never substitute a Gmail address for merchant ID.
4. Decide the compliant funds flow, seller KYC, who is seller of record, payment service fees, tax information, disputes, chargebacks and permitted hold schedule with PayPal. The two product routes are not interchangeable; payouts approval alone does not grant marketplace payment authorization.
5. Obtain verified PayPal onboarding consent for **each creator** before treating the payout recipient as linked. Store only the verified provider account identifier and state, not passwords.
6. Before enabling live checkout, consume verified paid-subscription webhook events; reconcile capture status, merchant account, currency, subscription and creator. Deduplicate by immutable PayPal event/capture IDs, not client-provided flags. Use a genuinely atomic transactional ledger and settlement holds to prevent duplicate earnings/withdrawals; reconcile against PayPal reports.
7. For a payout request, require signed-in owner, verified seller receiver, account protection, available net *cash* balance, regulatory reviews and an atomic reserve. Send PayPal Payouts with provider idempotency keys and retry/reconcile provider results. Never treat an asynchronous accepted request as `completed`; only verified provider payment status settles it. Handle on-hold, denied, returned, refunds and disputes.
8. Review platform fees, automatic renewals, refunds, transfer restrictions, and payout timing in live legal documents. Perform sandbox end-to-end tests for enrollment, subscription purchase, renewal, cancellation, chargeback and cash-out. No real user payment until those gates clear.

### What counts as creator cash earnings

Only valid PayPal **creator subscription payment captures** verified to the expected merchant and attributed to the correct creator. Funds reserved for pending payouts, refunds, chargebacks and processor/platform fees are excluded from the withdrawable amount. `reconcileEarnings` is a pure **calculation helper**, not a receipt verifier or transactional database; it must not be used as the sole proof of payment.

### What is **not** creator cash

- New-user 5 Suffering is a proposed *welcome grant*, currently **not issued**.
- 1 Suffering per AI generation is an announced *price*, currently **not charged**.
- Purchased/earned Suffering and tips are currently **non-cash-redeemable**, not creator withdrawal obligations.
- Platform AI memberships and payments attributed to platform-owned content are **not** creator payouts.
- A `verified_payment` boolean supplied by an app user or admin UI is never sufficient evidence.

### Contest and ranking safety

Monthly Top 10 is provisional and has no enabled prize winner. Paid tips, purchased credits, credit balances or payment amounts must never purchase eligibility, ratings or increased prize chances. There is no published cash/merchandise prize award until official rules, geography/age eligibility, anti-sybil and moderation controls, independent judging criteria and required provider approvals are reviewed.

### Non-credit checks

`npm test && node scripts/check-access.mjs && npm run build` in the Base44 sandbox. Check schema registrations for `CreatorEarning`, `CreatorPayout`, `CreatorPayoutProfile`, `ContestRating`. This **does not** verify hosted account flows, webhook identity, PayPal approval or actual transfers.
