# Only Cryptids — next implementation sprint

Prepared 2026-10-22. Owner: Interplanetary Association.

## Evidence and limits

This is a prioritized build plan, not a claim that all cryptid fans want the same experience. Existing research is preliminary; public community comments are self-selected qualitative signals. No representative survey, user interviews or conversion experiment has been conducted. No content was copied into a training dataset. Do not treat BFRO classifications or community popularity as proof that a creature exists.

The live visitor review on 2026-10-22 reached https://onlycryptids.base44.app/login: a plain light sign-in card with Google/email/password options, no preview stories or cryptid-specific imagery. The previous generated app hostname returned App not found. Signed-in screens were not accessible during this review. Repository improvements and a saved Base44 checkpoint do not establish that the live frontend/backend has been published.

Sources reviewed:
- https://www.reddit.com/r/bigfoot/comments/1wx18zx/sasquatch_chronicles_makes_ai_pivot/ — several participants value actual narrators, original witness voices and clearly illustrative visuals; object to generated evidence-like imagery. A small thread, not a market-wide finding.
- https://www.reddit.com/r/cryptids/comments/1kgng9j/whats_your_favorite_cryptid/ — creature-specific interest, regional lore, theories, illustrations and listening to encounter accounts. Supports offering multiple browsing paths rather than one assumed style.
- https://bfro.net/GDB/default.asp — public reports organized geographically, witness publication permission and follow-up notes. This is a product reference, not independent verification of its claims.
- https://operations.osmfoundation.org/policies/tiles/ — map attribution, browser caching/referrer, no bulk download/prefetch, limited best-effort service.
- https://developers.google.com/maps/documentation/embed/quickstart — free embed API requires API key/billing setup; it is not a substitute for the app's interactive multi-pin workflow.

## Top two look improvements

1. A distinctive, previewable cryptid front door: original regional forest/lake/winged imagery, a clear “Explore encounters” action, a sample original story and an obvious sign-in action. Keep text readable and imagery labeled as illustration. The live generic login currently provides no reason to join. Measure whether visitors open a story before asking them to register.
2. A reader-first content hierarchy: distinct encounter/fiction/art/AI/research badges, readable body text, restrained atmospheric decoration, large mobile controls and fewer competing navigation items. Map/list and reading should be reachable within one obvious action. Source batch has badges, browsing lanes and readability changes; verify them in the actual published build before claiming completion.

## Top two feature improvements

1. Evidence context without invented certainty: optional conditions, source links, limitations, alternate explanations, original media and follow-up notes. Separate creative quality from provenance. A “five footprints” rating should mean usefulness/craft, not a computed probability that a cryptid is real. Source batch includes optional written context and source links; original media and review workflows remain outstanding.
2. Creature-and-region discovery: link encounter stories to privacy-conscious map pins, then add region/date filters, related accounts, saved creature/region interests and opt-in notifications. Source batch includes linked pins, approximate coordinates and creature filters. Nearby radius search, saved interests and notifications are next-sprint work.

## Sequential implementation queue

| Order | Deliverable | Completion criteria | Dependency / cost boundary |
|---|---|---|---|
| 1 | Reconcile deployed app and source | Confirm canonical app/domain; publish intended frontend and backend together; anonymous live calls recognize sighting-list and credit-catalog; member/admin screens correspond to the saved revision. Capture screenshots of visitor, reader, creator and moderator paths. | Use connected sandbox/provider deployment only; no AI builder credit, Actions minutes or new paid host. Deployment is currently unconfirmed. |
| 2 | Previewable branded entry | Visitors can browse explicitly public sample content before login, with a cryptid-specific introduction and three browse choices. Registration remains required for interaction. No paid/private record becomes public through the change. | Check Base44 app-level auth/visibility and owner authorization before changing access; public UI must use a dedicated public projection. |
| 3 | Finish the encounter reader and media pipeline | Map → teaser → authorized full story → comments → report; edited/hidden/deleted stories disappear appropriately. Private originals, safe previews, file validation, metadata handling and authorized delivery work before uploads open. | Storage/video services stay disabled until free allowance and capacity are verified; never assume free transcoding. |
| 4 | Saved interests and map filtering | Creature, date range and general region filters work with server pagination; members can save interests and opt in to relevant updates. Approximate location stays the default, no background geolocation. | Avoid paid geocoding. Review OSM tile capacity before public scale. No automated email/push without member preference. |
| 5 | Transparent community quality review | Members rate usefulness/craft with 1–5 footprint icons. Reviewer notes say what was checked (source, media provenance, consistency), who reviewed and when. No AI “authenticity percentage,” no popularity-based truth badge. Anti-brigading rules and report/appeal controls included. | Keep AI evaluation inactive until explicit cost approval and accountable human-review workflow. |
| 6 | Creator subscription clarity | Offers clearly show Suffering and USD equivalent, what access includes, platform/creator beneficiary, duration, cancellation, paid-post extras and the inactive-payment state. | Finish legal configuration, trusted MFA enrollment, PayPal approval, idempotent funding, atomic spending, refunds and payouts before activating checkout. |
| 7 | Small real-user validation round | Recruit willing encounter readers, folklore fans, artists and creators; ask each to find a story, identify its type/source, use the map and understand an offer. Record consented aggregate outcomes and actual sample size. Revise priorities based on observed confusion. | No outreach sent without explicit instruction; no invented participant quotes or metrics. |

## Carry-forward constraints

- Interplanetary Association owns platform profiles; their subscription proceeds are designated for moderation. Independent creators retain their distinct contractual revenue recipient.
- Suffering remains $0.25 per unit. Purchased service credits do not buy sweepstakes entries or increase odds. No checkout/payout activation in this sprint without completed financial controls and approval.
- Keep ordinary login/free participation separate from monetization MFA. The separately requested signed assignment requirement remains until the owner changes it and legal settings are finalized.
- Research may guide agents, but generated material must not masquerade as witness testimony, original evidence or source research. Copyright assignment cannot create exclusive ownership of folklore, facts, ideas or third-party works.
- No paid generation, platform credits or build minutes without the user's specific approval and cost estimate.
