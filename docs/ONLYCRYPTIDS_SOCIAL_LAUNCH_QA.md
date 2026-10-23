# OnlyCryptids — October 23, 2026: social connection and launch gate

## Implemented in source and Base44 workspace

- Public social identity links for Reddit (users and subreddits), YouTube channels, X/Twitter, Instagram, Facebook, Threads, Bluesky and Tumblr. Links are validated against official HTTPS hostnames on the server and do not store credentials or imply authorized posting access.
- External links pasted into stories, discussions and comments become clickable for recognized platforms. Other untrusted external URLs remain plain text. Public social domains are strictly matched, not substring-matched.
- `@handle` resolves an active OnlyCryptids member, with community-name fallback. `@c/slug` directly resolves an OnlyCryptids community. Both respect blocked users and unavailable/hidden entities. These are native mentions, not external-platform account tags.
- `#hashtag` opens a dedicated view of related public stories and discussions; posts auto-extract hashtags from titles, teasers and body, preserving extra manually supplied tags. The discovery endpoint searches up to the most recent 250 published posts and 250 public discussions per request, with up to 50 results of each type. Private subscriber bodies are **not** indexed for public discovery.
- Share-to-Reddit, X and Facebook compose links, native share sheet, local Instagram image-card, and user-controlled invite action. YouTube, Instagram and other communities accept copied links/manual posting; this does not imply their APIs are connected.
- Optional verified-domain profile links on members and community pages.
- AI Storykeeper membership catalog, editor/style prompts, local-only reference-image preview and opt-in personalization from own public non-AI writing. **The model and PayPal billing are still disabled.** No training or credits are consumed by the app implementation.

## Automated verification in the Base44 workspace

- `node --test scripts/ai-policy.test.mjs scripts/social-linking.test.mjs`: 13/13 passed.
- `node scripts/check-access.mjs`: 81 synthetic authorization/API scenarios and 6 internal-link checks passed. The scenarios use fake records and intentionally **do not** make provider requests.
- `npm run build`: production Vite frontend built successfully. Bundler emitted non-fatal `use client` and bundle-size warnings.

These do not establish real end-to-end sign-up, post-save/publish, real-provider OAuth, or webhook/payment correctness.

## Checked Base44 account status

The app ID is `6ad9e37246a8642469c8c9fb`, Unrewound's Only Cryptids. Read-only entity/config check found:

- `PlatformSettings.legal_license_enabled=false`
- `PlatformSettings.legal_review_status='draft'`
- Legal address, jurisdiction, user contact email and copyright contact missing
- `PlatformSettings.media_enabled=false`
- `PlatformSettings.payment_status='not_connected'`
- Three published, free, clearly labeled fictional platform posts available, plus three platform-owned creator records.
- No tested proof of public account creation or member posting in the hosted deployment.

**Conclusion: not launch-ready; do not send mass invitations or claim paid features work.** The new code can be previewed in the workspace and requires explicit deployment before live users see it. The owner should resolve verified legal terms and actual hosted sign-up/publication tests, choose metered AI provider and quota/cost ceiling, and complete PayPal merchant verification before paid subscribers are accepted.

## Manual signed-in go-live matrix (not yet passed)

1. Mobile and desktop: open deployed site as signed-out and authenticated users, verify navigation, responsive body sizing and modals.
2. Register, verify account if required, log in/out, recover password, create handle with underscore, dash, mixed case; ordinary members cannot claim reserved admin handles, designated operator emails use verified roles.
3. Save post drafts and publish a free post with a signed and ready legal license; edit, delete, comment, react, follow, bookmark, block and report.
4. Publish `#lake_mystery` then open matching hashtag results from another post and forum reply. Verify drafts, hidden posts, paid-only bodies and blocked authors do not leak.
5. Mention `@username` and `@c/community` from story, forum and comment; verify ambiguous/missing handles and cross-account authorization.
6. Save and open Reddit, YouTube, X, Instagram, Facebook, Threads, Bluesky and Tumblr public profile links; reject unsafe hosts, credentials, wrong domains and script protocols.
7. Test external share/intents on mobile and desktop with owner-controlled accounts, without assuming automatic posting.
8. Review creator community membership/moderation and all existing free/paid content gating.
9. Run PayPal sandbox webhooks, lifecycle replay/refunds and generation allowances after explicit owner approval of real prices and provider budgets. Do not enable live paid features before success.
10. Verify domain DNS, accessible privacy/terms, complaint contact, accessibility, bot protections, monitoring, backup, security and responsible invitation/opt-out flows.

Invite button only opens device share or copies a public link; it does **not** email/DM users itself or harvest social contacts.
