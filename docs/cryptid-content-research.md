# Cryptid content guide — preliminary research, 2026-10-22

## Scope and limits

This guide covers community discussions, short fiction, field journals, folklore explainers, captions, still artwork, audio scripts, video scripts, and merchandise briefs. It is a documented starting knowledge pack for generation, not a claim to have researched every cryptid or measured the entire market. Scripts are not generated recordings. No AI generation provider has been activated.

Sources were chosen for folklore context and firsthand community expression. Public community samples are self-selected, small and not representative; individual preferences do not establish market demand, conversion rates, or a ranked best-selling style. No posts were copied into a training dataset, and no private/subscriber content was accessed.

## Evidence and design implications

1. **Library of Congress, Legends and Belief Tales.** The guide describes legends as extraordinary accounts that invite belief or debate and places them in oral storytelling traditions. Design implication: offer an encounter-discussion format with room for uncertainty and alternate explanations. This does not authorize presenting generated fiction as a real encounter. Source: https://guides.loc.gov/folktales-oral-storytelling/scary-stories

2. **r/cryptids, “What's your favorite cryptid?”** Participants discuss mysterious creatures, attachment to local legends, speculative biology, listening to encounter stories and podcasts, and playful artistic treatments. This suggests supporting more than one tone and multiple media. It does not prove any cryptid is real or any theme is universally preferred. Source: https://www.reddit.com/r/cryptids/comments/1kgng9j/whats_your_favorite_cryptid/

3. **Bloomsbury, Bigfoot to Mothman publisher description.** The publisher frames cryptids through cultural, historical and social context and distinguishes cryptids from related invented or mythical creatures. Design implication: organize by creature and region with context fields; do not label every spiritual or folkloric being an interchangeable cryptid. Only the public description was read, not the full book. Source: https://www.bloomsbury.com/us/bigfoot-to-mothman-9781440877261/

4. **Smithsonian, Mothman of Point Pleasant.** The search-accessible description associates the creature with its town and local folklore. Full-page retrieval failed, so this is supplementary metadata rather than a detailed research basis. Source: https://folklife.si.edu/magazine/mothman-point-pleasant-west-virginia

## Generation specification (editorial decisions, not measured facts)

| Form | Expected output | Required distinction |
|---|---|---|
| Forum discussion | Focused hook, context and open-ended question | Invite discussion without invented evidence |
| Short story | Scene, sensory detail, escalation, creature-consistent reveal, ending | Clearly identify fiction/AI assistance |
| Field journal | Region, conditions, observation sequence, scale, alternatives, limitations | Invented journals are fictional, not field evidence |
| Folklore explainer | Cultural/region context, variations, verified references | Research-needed outline if retrieval/citations unavailable |
| Artwork caption | Description, intent, traits, disclosure and invitation | Do not pretend an illustration is a sighting photo |
| Audio script | Narration, sound cues, pauses and disclosure | Script is not rendered audio |
| Video script | Matching shot, narration, caption and timing | No unrelated footage/narration pairing |
| Image brief | Anatomy, scale, environment, action, composition and lighting | Preserve user-described details |
| Merchandise brief | Recognizable silhouette, intentional palette and product-aware layout | Check actual supplier template; no invented specifications |

Visual menu: eerie naturalist, field-notebook ink, retro folklore poster, cozy/playful cryptid, bold merchandise graphic, cinematic mystery. These are proposed choices, not a research finding that everyone expects the same aesthetic. Do not imitate a living artist's exact style or copy a particular copyrighted design. Original creatures require user-specified traits and should not be confused with documented traditions.

## Runtime use

`src/content-guide.js` packages the versioned research context, controlled formats/styles, short-input limits and prompt builder. `CreationLab.jsx` lets users prepare and review the brief without spending credits. When generation is connected, the server must load this guide rather than trusting client-supplied system instructions; include only authorized story/comment context, exact cost confirmation, generation-job accounting, AI labels, moderation and user approval before posting. Research-mode source URLs must come from verified retrieval, not merely this guide's source list.

For audio/video generation, validate the actual resulting media against the prompt, transcript and scene brief; a format dropdown or script does not establish media alignment. For merchandise, verify the actual print file, permissions and final proof.

## Future validation

Invite real users to choose formats and tones, record consented aggregate feedback and retention signals, and publish honest sample sizes. Keep research versions and dated sources. Do not fabricate engagement statistics or claim exhaustive research.
