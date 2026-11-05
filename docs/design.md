# Music Nerd Apps — local review, November 3, 2026

## Initial direction (superseded by Style B below)
A playground for music people. App experiences are the focal point; the surrounding community stays quiet. Reuse MusicNerdWeb's real face mark, lowercase wordmark, system sans typography, circular avatars, 16px glass panels, rounded controls, visible focus, and persistent light/dark theme. Brand colors come from its DESIGN.md and actual globals.css: pink #ff9ce3, orchid #ef95ff, cyan #2ad4fc, mint #19ffb8, aubergine #422b46; white and #1a1a1a base surfaces. Pink is identity; cyan becomes the dark interaction accent. Define semantic tokens centrally rather than reproducing the legacy override wall.

Layout: shared header → featured playable app → category-filtered thumbnail catalog → creator discovery. App route: large playable stage beside discussion, then app description and creator. Creator route: wide cover, overlapping avatar, bio and follow control, apps/saved tabs. At phone widths the player and discussion stack and catalog becomes one column. No new font dependency; existing Music Nerd renders system sans.

Reference observed: https://dangertesting.com/ (featured app), /apps (thumbnail catalog), /marcgmbh (banner/avatar/bio/subscriptions/drops/creations/likes), /marcgmbh/link-bouquet (embedded app/fullscreen/creator subscription/chat). Public content inspected with Firecrawl; no proprietary source or assets copied. Music Nerd asset copied from existing local MusicNerdWeb/public/musicNerdLogo.png.

## Review scope
Standalone frontend foundation, localStorage persistence for demo identity, likes, follows, saves, comments/replies, profile edits and app-submission drafts. Example apps and creators are explicitly demo content, not real user endorsements or availability claims. Included mini-apps run locally: Loop Garden step sequencer, Chord Colors synthesizer and Pocket Tempo metronome. No account password collection and no external social writes. Audio begins only on user gesture, stops on route change, and uses low gain.

## Production follow-up
Pete confirmed a standalone site at apps.musicnerd.net. Reuse Music Nerd identity rather than create duplicate accounts. Shared database/API required for creator profiles, app catalog, comments/replies, follows, likes, reports, notifications and moderation. Submission drafts need owner checks, review and publish lifecycle. Approved third-party apps need isolated sandboxed iframes, capability policy, embed-denied fallback, readiness/error handling and an external launch link. Never assume a frame load event proves successful embedding. Real following feed and notifications need server-backed events. Prototype storage is per browser, not authentication or a shared community.

## Lens addition
Pete supplied https://v0-musicnerd-lens.vercel.app/ and explicitly requested attribution to Pete Rango. Added /peterango/musicnerd-lens and /peterango. Headers returned HTTP 200 without X-Frame-Options or restrictive frame-ancestors. Browser verification confirmed actual Lens content rendered inside the sandboxed frame, including Start Scanning. Camera capture and recognition have not been exercised. The frame delegates camera/fullscreen only; direct launch and reload are always available. No permission prompts were accepted.

## Approved Style B direction and immersive player
Pete requested matching Style B at http://127.0.0.1:8087/, identified and inspected as the Cut & Paste original at /private/tmp/mntv-style-review/b-v2.png. This supersedes the initial glass direction. Shared store chrome now uses Barlow Condensed Bold (from the existing Music NFT Era project), ink #090909, paper #fcfcfb, hot pink #ff4fca, subtle paper texture, irregular pink tape, square paper app covers and prominent play/save controls. Mobile navigation sits in a black bottom bar. Dark theme preserves hot pink with reversed paper/ink. Music Nerd's supplied boxed logo asset comes directly from Pete's Lens app; no logo was redrawn.

Player routes remove the catalog width cap. The embedded app occupies the viewport beneath a compact navigation/tool strip; conversation is collapsed by default and opens alongside on desktop or below on phone. Details remain below the player. No CSS is injected into third-party apps. Lens is now the featured app.

## Clean catalog refinement — November 3

Pete approved a quieter version of Style B after finding the collage treatment too busy. Inspected Danger Testing's live `/apps` catalog in Safari: large regular image grid, brief descriptions, creator attribution, and restrained navigation. Removed the feature hero, paper texture, tape, card rotation, heavy outlines, and uppercase card titles. Retained the Music Nerd wordmark, condensed page headings, and pink accent. Shared cards use a consistent 16:10 image area, normal body typography, and secondary save actions on hover/focus (always available on touch).

Lens now has an actual browser-rendered screenshot in `public/lens-preview.webp`; demo app illustrations remain labeled as demos. Smaller profile covers bring apps closer to creator details. The nearly full-viewport player and optional conversation remain. Phone categories use a dropdown to avoid crowded horizontal controls. Browser checked light desktop catalog and dark phone catalog, profile, and embedded player at 390px; Lens camera flow remains untested. Production build and self-contained review generated successfully. This remains a local prototype.

## Music Nerd collection identity

Latest approved direction keeps the clean grid while moving away from the reference store's signature layout. Music Nerd logo is left aligned without an appended apps wordmark, navigation uses sentence case, and the submit control has a restrained pink outline. Compact editorial introduction: Made for listening, discovering, and making. Cards have smaller titles, creator names, concrete descriptions, and pink arrows on hover/focus (visible on touch). All four covers now use actual rendered product interfaces, with demo listings still explicitly labeled. Browser verified desktop light and dark, pink hover interaction, and 390px mobile light layout. Build and standalone review regenerated. Screenshots captured without starting audio or requesting camera permissions.

## Community implementation — November 3, 2026

The latest implementation replaces the earlier local-only community limitation with an optional dedicated Supabase integration. Without credentials it retains clearly labeled device-only preview behavior. Profile photo/banner forms, app submission requirements, draft editing, review requests, moderation/reporting, direct-link embed fallback and share metadata are implemented. Launch collection and Music Nerd curation remain deliberately out of scope. Supabase Auth/Storage and hosted routes still require live configuration and verification; `backend-setup.md` is the current handoff.

Browser checks confirmed local profile creation, screenshot selection, draft persistence and transition to pending review. The phone submission dialog was visually checked in dark mode, and the desktop profile dialog in light mode, using existing Music Nerd controls and focus styles. Native iOS, hosted authentication/storage and the moderator screen with a live account remain unverified.

## Experience recipe — November 3, 2026

Approved homepage language: “Go deeper into the music.” / “Explore the stories, people, and connections behind the music through interactive experiences.” Medellín Metal now includes the user-provided creation recipe below the player, linked by “How it was made.” “Try the recipe” is the approved heading, with a “Copy recipe” button copying the full source prompt. Build details, primary research links, and the explicitly simulated Music Nerd integration are disclosures. Shared surface/color/button tokens are reused. Browser checked desktop and 390px layouts, light/dark themes, disclosure, and real clipboard paste including final prompt paragraph. No new API integration is claimed or implemented.

## Branded share images — November 3, 2026

Compared the current public Rae Isla card and GitHub main artist share renderer. Lab, Lens, and Medellín Metal now have 1200×630 cards using the exact pink glasses asset, Inter Bold, black background, and large pink/white lettering. Photo composition follows the artist renderer's right-side portrait and left gradient. Versioned /social/*-v2.png URLs are used in OG and Twitter metadata, with dimensions and alt descriptions. Gallery browser review covered full-size and 390px card widths. Live HTML and image bytes verified; native messaging-app cache refresh is outside this verification. Generator: scripts/generate-share-cards.cjs. Font license and source artwork retained in design/share-assets. Archive photo credit remains Román González / Universo Centro, with its source on the experience page.

## Protocol submissions — November 4
Protocol terminology replaces app terminology on submission/detail actions. Guided form uses existing system sans, semantic surface/ink/muted/accent tokens and shared button/focus behavior. Nine steps: name, description, about, instructions, optional source, optional tools, experience URL, cover, review. Back/edit preserve current answers; final draft/review writes use existing ownership/RLS. Authentication/profile creation resumes the submission intent. Protocol report is a prefilled mailto dev@xdjs.com; comment reports retain moderation. Agent publication uses scoped expiring revocable keys and stable-ID PUT updates, documented in public/protocol-api.md. The public form still requires working email authentication.


## Creator forms — 4 November 2026
Profile editor reuses the Lab Barlow Condensed display font, black/white theme tokens and pink accent. Shared ImageField now uses cover/avatar previews and labeled keyboard-accessible file inputs; no native chooser is exposed visually. Display name and handle pair on desktop, stack at 390px; optional labels, live identity preview, character count and sticky save footer improve hierarchy. Saving is disabled during profile uploads. Shared dialog fields, focus and buttons extend to protocol submission. Reviewed local rendered profile at desktop and 390px in light/dark; local-only create/save succeeded. Protocol first step reviewed in dark desktop. No real creator profile was created for QA.
