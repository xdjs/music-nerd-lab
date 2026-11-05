# Shared Music Nerd avatar

Music Nerd owns the user name and original profile image. Lab owns the handle, bio, cover, website and protocols. Lab does not copy or upload account avatars.

`GET /api/avatar?creator=<Lab handle>` resolves an active linked Music Nerd account server-side. It reads `avatar.webp` from the existing private `user-profile-images` bucket, using the same identity-folder then legacy account-folder lookup as MusicNerdAPI. It returns image bytes, never private account fields, folder paths or credentials. The URL is stable. Browser/CDN cache is 60 seconds without stale serving; a new page load after that sees replacements or removals. An open page is not live-pushed.

A narrowly scoped Storage SELECT policy permits only the exact avatar paths of non-hidden accounts with public Lab profiles. The bucket remains private. Other objects and accounts without Lab profiles remain inaccessible; no upload/delete permissions are added. The policy's private security-definer predicate needs account metadata to evaluate this public-image boundary but returns only a boolean and has an empty search path.

Missing photos use the standard pink fallback. Upstream errors are not treated as permanent absence and are not cached. The former photo-import endpoint is retired. Existing copied media are retained but no longer used by connected profiles. The editor links to Music Nerd for photo/name edits and has no independent avatar upload.
