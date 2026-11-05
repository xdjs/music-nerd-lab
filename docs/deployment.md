# Deployment — November 3, 2026

Primary URL: https://lab.musicnerd.vercel.app
Previous alias: https://musicnerdlab.vercel.app

- Vercel team: Music Nerd (`team_cdz3kA179XUTUNZgMSfko0x4`).
- Dedicated Lab project: `music-nerd-apps` (`prj_3qtAvnhpyoE6MA0TAbIozhHIuPHj`).
- Production deployment: `dpl_3B85g1M1D2MayYk3eVaVxLDXDo89` (READY). Source deployments through Vercel connector; no Git integration.
- Existing Music Nerd Supabase project `cbabvmebugudeuylronz` connected using public key; additive Lab tables and isolated policies.
- Exact Lab auth callbacks saved and verified in dashboard; existing Site URL retained.
- Email currently uses Supabase built-in service. Custom SMTP is not configured. Public sign-up delivery and authenticated user journeys remain unverified; configure delivery before public account rollout.
- Only Lens and Medellín Metal are published. Three demos archived. Placeholder demo creators omitted from directory.
- Live desktop light/dark catalog and embedded Medellín Metal verified in Safari. Local 390px catalog checked in both themes; not native iOS. Share metadata resolves from database. All four local authorization/validation tests pass.
- lab.musicnerd.net remains assigned but needs Squarespace DNS access. CNAME host lab: 24c95cfa2e9049a1.vercel-dns-016.com.
- No existing Web deployment or DNS records changed.

See backend-setup.md for account ownership, moderation, and remaining live-account verification.

## November 4 protocol publishing
Production deployment dpl_C5cmNm2dLJA9enAj7ruaLaByFri3 is READY. PUT /api/protocols creates/updates creator-scoped entries with expiring hashed publishing keys. Live authenticated draft PUT and repeated-id update passed; the single QA draft was archived and public catalog remained Lens and Medellín. SQL transaction verified revoked-key rejection and cross-creator denial. Seven automated tests pass. Guided form browser checked at desktop light and 390px dark; step navigation and complete review verified with local fixture. Public email sign-in and a real signed-in web submission remain unverified. Private publishing key issued for Music Nerd agents, secret stored only in ignored local .publishing-key-musicnerd-1793811526891 (mode600); no secrets uploaded.

## Custom-domain share metadata — November 4
Changed canonical and Open Graph origin to https://lab.musicnerd.net and versioned homepage share image to music-nerd-lab-v3.png (same approved artwork). User observed a Medellín cover in a share composer despite correct live OG declarations; stale platform cache or fallback selection remains unconfirmed. Fresh query URL /?share=lab-v3 provided for retest. Deployment dpl_CPanu9FXqsTGe1zURGG3wFb6vYhe. All seven tests pass.

## 2026-11-04 — Form polish and Music Nerd publishing roles
Production deployment `dpl_D4SgpVoyPySxwKtFP5TH11AvdpP6` is READY and aliased to https://lab.musicnerd.net. Shared form styles, profile cover/avatar preview, authoritative whitelist auto-publication, and admin removal/restoration deployed. Database migrations `20261104184128_lab_trusted_publishers` and `20261104184719_lab_preserve_admin_removals` applied and definitions verified. Public catalog still contains exactly two protocols. Build and eleven targeted/full-suite tests passed across the final test runs. Browser review: Chrome desktop and Safari 390/1100 local renders, light/dark profile; protocol first step dark desktop and light phone width. Actual signed-in production writes were not used to create test content.

### 2026-11-04 account attribution follow-up
Medellín Metal now belongs to the linked `peterango` user, alongside Lens. The former `/musicnerd/medellin-metal` URL permanently redirects to `/peterango/medellin-metal`. IDs, comments and activity are preserved. The atomic attribution migration restores the identity guard before commit.

The user-account avatar fallback reuses MusicNerdWeb's exact `default_pfp_pink.png` asset in cards, the header, profile and editor. Correction: the earlier static-avatar conclusion came from a stale checkout. Current Music Nerd loads user photos from Storage through its profile-image API. No artist metadata is imported. Account actions link to Music Nerd's `/profile` dashboard.

Validation: production build and all 11 tests pass; local Safari 390px light profile/editor and 1100px dark profile visually checked.

### Shared user identity — 2026-11-04
The live Web users schema has username and role flags, but no user avatar, bio, website or banner fields. The user photo is stored separately in Storage; current Main Web reads it through MusicNerdAPI. Lab does not infer identity from artist photos or social-provider identities.

`lab_shared_account_identity` makes linked profiles use users.username, synchronizes subsequent username updates, and prevents Lab edits from creating a conflicting display name. Private trigger functions expose no user-table reads to public callers; blank/email usernames use Music Nerd member. Lab handle, photos, bio, website and banner are retained. Names over 60 characters are capped for the existing Lab constraint.

Profile editor points to Music Nerd account settings for name edits and explains the Lab-only fields. Authenticated own-account actions include links for approved artist claims, queried only for the verified user's ID; these links do not import artist metadata. Existing role authorization remains database-driven.

Validation: build and 11 tests passed, including main-to-Lab name propagation, attempted Lab name override, preservation of uploaded avatar/bio, anonymous email suppression and account isolation. Live database confirms Pete Rango's name matches and one approved artist link. No production username was changed for QA.
Live verification: signed-in Safari `/you` shows Pete Rango, both protocols, admin controls, account link, and approved artist link. Live profile editor displays the authoritative readonly name and correct account-settings destination. Local 390px form content reviewed in both themes (fixture; not a signed-in mobile session). Security advisors reported no new findings after migration.

### Shared avatar source — 2026-11-04
Production deployment `dpl_5cKbWAdPaNA4AViYNg8cT6FYR7ci` replaces `dpl_4FHKJHtY9JVHMWQ262CgcC7Yqb4W` and is READY on lab.musicnerd.net. `/api/avatar?creator=<handle>` serves the original Music Nerd Storage object with a 60-second cache. Connected profiles use it automatically; independent avatar uploads/imports are removed from the editor, and the former import endpoint returns 410. Main Web and its authenticated profile-image endpoint are unchanged. No new service credential was added. Existing copied Lab media remain stored but are no longer displayed by connected profiles.

The additive `lab_shared_avatar_read` policy permits reads of exact avatar paths only for non-hidden accounts with public Lab profiles. Storage stays private, with no new upload/delete grants. Policy tests cover anonymous and authenticated reads, hidden/non-creator denial, other files/buckets, no writes, and removal of the public creator profile. Security advisor findings are unchanged (timestamps excluded).

Build and all 17 tests pass. Live signed-in Safari verifies the Rango photo in navigation, creator header and the updated profile editor with no import/upload action. Local 390px editor reviewed in light/dark; not native iOS. Original-photo replacement/removal behavior is covered with controlled tests; Pete's production photo was not changed for QA. Photo updates appear on a fresh page request after the short cache expires, not via push to an already-open page.

The authenticated community response and creator share metadata use the same stable avatar reference. Direct live browser navigation to the avatar endpoint returned the 512×512 Rango image. Final tests passed with serial execution (17/17); one concurrent rerun stalled and was stopped.


### Medellín API protocol display — 2026-11-05
Updated the existing peterango/medellin-metal record through PUT /api/protocols. Only instructions, source_url, tools_used and updated_at changed; anonymous catalog read-back exactly matched the prepared payload. The temporary five-minute peterango publishing key was revoked immediately after successful use.

Fixed the Medellín-specific ExperienceRecipe renderer to consume the app record instead of always using its static fallback. Rendered text, clipboard copy and manual copy share that same value. Existing research resources and legacy fallback remain; tools and source also come from the API. Baseline verified against all 57 source files from production dpl_8v5hyvA4YCMQLoZbHYd6ha4mg9nm before the isolated two-file change.

Production dpl_G613VKefyTtUDEJvncXkUzcm4x35 is READY on lab.musicnerd.net. Build and all 17 tests passed; focused server-render verification checked API instructions/tools/source and empty-content fallback. Tracking: https://github.com/xdjs/MusicNerdWeb/issues/1662 . Saved publishing content: docs/recipes/medellin-protocol.txt and medellin-listing.json.
