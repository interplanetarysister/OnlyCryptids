# OnlyCryptids licensed-media scout

The Cloudflare Worker `onlycryptids-media-scout` runs every 30 minutes. Its persistent state and licensed image/video post metadata live in Cloudflare D1 `onlycryptids-media-scout` (database 704c0ac1-bf6d-4227-be9a-f9f90c284619).

Public read-only feed: https://onlycryptids-media-scout.interplanetary-fund.workers.dev/api/posts
Public status: https://onlycryptids-media-scout.interplanetary-fund.workers.dev/api/status

## Discovery and publication
- Each scheduled run checks whether the server-side enabled flag is true; if disabled, it stops without sourcing posts.
- When enabled, it searches up to 12 Wikimedia Commons files for one of 14 rotating cryptid, monster, UFO and alien topics, and inserts at most two new media-backed posts per run.
- Accepted types: JPEG, PNG, WebP, GIF, WebM and Ogg video. Permitted reuse licenses: CC0, public domain, CC BY and CC BY-SA. Files with unknown attribution, missing license data, commercial restrictions or invalid URLs are rejected. The unique original page ID prevents repeat posts.
- Each new reference-media item has a brief original description; original-file credit; author; license and license URL; title; media; source URL; alt text; and #content, #cryptids and creature/topic hashtags.
- The media remains with its licensed source (Wikimedia Commons, or source indexed by Openverse when Commons refuses access) and is embedded; binary files are not copied to OnlyCryptids storage. No paid AI models or GitHub Actions runners are used.
- Source references are labeled as illustrations/media references, not verified sightings. Wikimedia metadata is not independently verified.

## Deployment
Main script: workers/media-scout/index.mjs
D1 schema: workers/media-scout/schema.sql
Wrangler configuration: workers/media-scout/wrangler.jsonc
Cron: */30 * * * * (UTC)
Home/Explore/tag client: src/CuratedMedia.jsx

## Stop, resume, remove content
Use the connected Cloudflare D1 console, or ask ChatGPT to perform the operation using the authorized Cloudflare connection. The public Worker only provides read APIs; no credentials or stop endpoints are exposed to site visitors.

Stop: UPDATE scout_control SET enabled=0 WHERE id=1;
Resume: UPDATE scout_control SET enabled=1 WHERE id=1;
Verify: SELECT enabled,term_index,search_offset,last_run,last_added FROM scout_control WHERE id=1;
Count: SELECT COUNT(*) FROM sourced_media;

Stopping prevents new publication on the next run, without deleting earlier entries. Deleting a sourced_media row removes that record from the public source-backed feed. Stop scheduling altogether by removing the Cloudflare Cron Trigger.

## Rights and migration boundaries
Attribution is not redistribution permission. New source adapters must use authorized APIs or legitimate public embeds and respect platform terms, licensing, consent, privacy, user reports and takedown notices. Do not copy random online images/videos just because they are accessible. Any CC BY-SA adaptations require appropriate license compliance.

OnlyCryptids member login/posting remains Base44-dependent as documented in docs/HOST_MIGRATION_READINESS.md. The source-media Worker is independently deployed, but website visitors won't see the integrated feed until the frontend change is deployed to the current OnlyCryptids host.

## 2026-10-25 taxonomy integration

The source-media collection is now explicitly separate from Fiction and Non-fiction editorial posts. It supplies a canonical topical category and `genre: Reference media` on the API, adds the requested skinwalkers, aliens, ghosts, alien technologies, sacred space sightings, and Dreamscape searches, and can filter by category. The image fallback is Openverse's anonymously accessible public API at a low search frequency; it respects Commons HTTP 403 responses instead of retrying a refused endpoint. Attribution and stated license are still checked for each indexed item. Openverse is an image index, not a replacement for licensed-video access.
