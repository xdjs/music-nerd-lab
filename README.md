[Source and hosting status](docs/SOURCE-HOSTING.md) · [Music Nerd Lab](https://lab.musicnerd.net)

# Music Nerd Apps

Standalone app store and creator community for **lab.musicnerd.vercel.app**. The approved minimal Music Nerd design is retained; launch collection and editorial curation are intentionally out of scope.

## Review locally

Run `npm ci` then `npm start`; open http://127.0.0.1:4186. Without Supabase environment variables the app explicitly runs in device-only preview mode. Preview profiles, submissions, comments, reports, saves and follows remain in this browser. It does not send review requests to a moderator.

`npm run build` builds production assets. `npm test` tests input validation, embed network restrictions and database ownership/moderation policies in PostgreSQL through PGlite. `python3 scripts/make-preview.py` generates the self-contained `review.html` and `review-phone.html` from the latest unconfigured build.

## Implemented

- Creator profiles with photo, banner, bio, website and permanent handle.
- Supabase email-link authentication integration, shared comments/replies/follows and private saved apps.
- Own-comment deletion, private reports and a moderator review queue at `/review`.
- App screenshot upload, category, pricing, account/device requirements, draft editing, submission, requested changes and moderator publishing.
- Immersive embedded player with direct-link fallback; authenticated server-side framing-header checks with public-network restrictions.
- App and creator share metadata, a branded default share image, and Vercel configuration.

The public collection contains Music Nerd Lens by Pete Rango and the Medellín Metal artifact by Music Nerd. Demo listings are archived. The site is deployed at **https://lab.musicnerd.vercel.app** in the Music Nerd Vercel team and connected to the existing Music Nerd Supabase project, as requested by Pete and Carl. See [setup instructions](docs/backend-setup.md) for activation and the remaining verification.

## Design

Shared Music Nerd logo, typography and restrained pink accents; screenshot-first catalog; white/near-black themes. Profile and submission controls reuse the existing buttons, inputs, dialogs and focus styles. See `docs/design.md` for design history and references.
