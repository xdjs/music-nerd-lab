# Shared Music Nerd backend

Pete and Carl selected the existing Music Nerd Supabase project (`cbabvmebugudeuylronz`, XDJS account). This supersedes the earlier dedicated-project plan. Lab uses additive `mn_*` tables, `mn_private` moderator configuration, and the `mn-images` bucket. Existing Web tables and authentication settings are preserved. Lab uses Supabase email-link Auth; this does not imply shared Web login sessions.

## Current setup

- Community, image bucket, catalog, permanent-account restriction, and artifact migrations are applied remotely. Remote migration timestamps differ from local source names; reconcile history before any CLI `db push`.
- Production Vercel environment has `VITE_SUPABASE_URL` and the public anon key in `VITE_SUPABASE_PUBLISHABLE_KEY`. Server endpoints use these same values. No service-role key is used.
- Auth redirect allowlist contains exact `https://lab.musicnerd.vercel.app/` and `https://musicnerdlab.vercel.app/` URLs, verified in the dashboard. Existing Site URL was retained.
- Shared project anonymous sign-in settings are untouched; restrictive RLS prevents anonymous accounts from writing Lab data.
- Local development without `.env.local` remains device-only preview mode. Local API endpoints require the Vercel runtime.
- Public collection is Lens and Medellín Metal. Three demo apps are archived.

## Account ownership and moderators

Create the real account through email sign-in. Verify its email/account identity in the Supabase dashboard. The reserved creator handles cannot be claimed through the public form. An operator with database-owner access can bind Pete's **verified** auth user UUID to the existing reserved `peterango` profile and Lens app in a transaction:

```sql
begin;
update public.mn_profiles set user_id = 'VERIFIED_AUTH_USER_UUID'::uuid
 where id = 'peterango' and user_id is null;
update public.mn_apps set owner_id = 'VERIFIED_AUTH_USER_UUID'::uuid
 where creator = 'peterango' and owner_id is null;
commit;
```

Check affected rows and existing ownership before committing. The triggers allow only the database operator roles `postgres` or `supabase_admin` to bind ownership; ordinary accounts and moderators cannot transfer it. Do not infer account ownership from a display name.

Grant an explicitly chosen moderator through privileged SQL:

```sql
insert into mn_private.moderators(user_id)
values ('VERIFIED_MODERATOR_UUID'::uuid);
```

The moderator list is private and cannot be changed through client metadata. `/review` publishes pending submissions, requests changes, hides reported content and resolves reports. Editing a published app as its owner returns it to draft or review; this first version does not maintain a separate published revision.

## Deployment and verification

The dedicated Lab Vercel project is already connected. See `deployment.md` for project and domain details.

Verify on the actual hosted preview:

- Email sign-in, sign-out, refresh, expired links and a second independent account.
- Image uploads (JPG/PNG/WebP, 4 MB limit) and cross-account storage restrictions.
- Draft -> pending -> changes requested -> resubmitted -> published; rejection of direct publishing.
- Saves private across accounts; public follows, comments, replies, deletion and private reports.
- Moderator visibility/authorization and report resolution.
- Framing check for permitted, blocked and redirecting apps; loading/direct-link fallback; Lens camera flow on a real phone.
- Route refresh and share-bot HTML for app/creator URLs, static assets and unknown routes; Vercel function asset tracing must be confirmed on deployment.
- Desktop and phone layouts, both themes, keyboard focus and screen-reader labels.

Local SQL tests validate policies in PostgreSQL, not the live Supabase Auth/Storage services. Real email delivery, storage, hosted embeds, Vercel routing/metadata and camera permissions remain unverified until tested with real accounts. Current browser verification uses Safari and a 390px viewport, not native iOS.

## Operational follow-up

This implementation loads the initial catalog/community data in one request per table and refreshes on writes/window focus. Add pagination and subscriptions as usage grows. Uploaded objects are immutable; replacing/removing an image from a form does not delete its prior object. Define an orphan cleanup/retention process, account-deletion workflow and report response ownership before public launch. Comment posting has a database throttle; broader account/submission/report abuse limits still need deployment-specific configuration. No launch collection or curation work has been added.

## Privy accounts — November 4
Lab uses Music Nerd Web's production NEXT_PUBLIC_PRIVY_APP_ID and SUPABASE_DB_CONNECTION. Only the app ID is exposed to Vite; the database connection remains server-only. Access tokens are verified with Privy's public JWKS, ES256, issuer, audience and expiry; no Privy app secret is needed. Server requests resolve public.users by the verified privy_user_id, reject hidden or unknown accounts, and set the existing Music Nerd UUID in transaction-local request claims. Lab foreign keys reference public.users; RLS enforces ownership under mnweb. Supabase Auth sessions no longer authorize Lab writes. A first-time user without a Music Nerd Web record must complete account setup on musicnerd.net. No email-based linking or automatic reserved-creator claiming.

Public catalog reads remain on the anon client. Creator images uploaded with Privy are immutable, limited to 3 MB PNG/JPEG/WebP and 20 per user per hour, stored in mn_media and served at /api/media?id=. Existing Supabase Storage images remain readable. Future large media should move to object storage; this implementation supports small profile and cover images.

Privy allowed origins must include https://lab.musicnerd.net (and any alias on which login is offered). Same Privy account does not imply a shared NextAuth cookie or automatically shared cross-domain login session. Do not claim signed-in end-to-end verification until the live login and a persisted owner-scoped action succeed.


## Music Nerd publishing roles — 4 November 2026
`mn_private.is_publisher()` checks current Music Nerd `users.is_white_listed` or moderator status. `is_moderator()` includes Music Nerd admins/superadmins plus existing explicit Lab moderators. The API reads these booleans inside the verified-account transaction; no client flags are trusted. Pending submissions become published for trusted users; drafts remain drafts. RLS independently permits only trusted users to publish their own content. Admin moderation does not require a Lab creator profile. Archived protocols require admin restoration, including agent-key submissions. The Manage protocols screen supports removal and restoration. Public collection remains the two approved protocols. Privy global allowed origins now includes https://lab.musicnerd.net; Chrome reused the existing Music Nerd identity successfully.

Validation: crypto token rejection, mnweb account isolation, whitelist publication/revocation, unauthorized role elevation denial, admin removal/restoration, and authoritative API status tests pass. Local server DB connectivity was unavailable due sandbox DNS; production read succeeded through the signed-in account. No production protocol was published/removed as QA. Dependency audit after adding Privy reported 29 transitive findings (11 moderate, 18 high), largely wallet dependencies; non-force audit fix failed DNS and no force downgrade was applied. Private moderator/key tables intentionally have no RLS policies; public catalog GraphQL visibility is intentional with RLS.


## User account continuity correction
Pete clarified that his Music Nerd user profile is separate from his artist profile. The existing Lab `peterango` profile and Music Nerd Lens ownership are now linked to his existing Music Nerd users.id. Artist photo/bio import was undone, and no runtime artist-claim import is deployed. Lab creator details remain separate; authentication and whitelist/admin privileges use the same Music Nerd user. The temporary artist bio-length migration was reversed by lab_user_profile_bio_limit; the DB, form and API remain aligned at 500 characters. Future account carryover must use user records, not artist records.
