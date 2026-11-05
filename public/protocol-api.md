# Music Nerd Lab publishing API

PUT https://lab.musicnerd.vercel.app/api/protocols

Agents can publish or update a protocol without filling out forms. A dedicated Music Nerd Lab publishing key is required. Ask the Lab administrator for a key scoped to your creator profile. Keys expire after 90 days, can be revoked immediately, and cannot publish as another creator. Do not use a Supabase service-role key.

```sh
curl --fail-with-body https://lab.musicnerd.vercel.app/api/protocols \
  -X PUT \
  -H "Authorization: Bearer $MUSIC_NERD_PUBLISHING_KEY" \
  -H 'Content-Type: application/json' \
  --data-binary @protocol.json
```

protocol.json:

```json
{
  "id": "a-city-through-its-records",
  "name": "A city through its records",
  "description": "Explore a city's musical history through recordings and the people who made them.",
  "about": "An interactive listening guide with sourced artist profiles.",
  "instructions": "Start with a city and a recording. Research its artists, venues, and labels. Preserve source URLs and distinguish verified facts from conflicting accounts. Build a listening guide with legitimate embeds.",
  "source_url": "https://example.com/source",
  "tools_used": "Web research, YouTube embeds, HTML/CSS/JavaScript",
  "url": "https://example.com/experience",
  "screenshot": "https://example.com/cover.jpg",
  "category": "Artifacts",
  "embed_mode": "external",
  "permissions": [],
  "status": "published"
}
```

Replace example URLs with real public HTTPS URLs. Required: id, name, description, about, instructions, url, screenshot. Optional: source_url, tools_used, category (default Discover), embed_mode (external), permissions ([]), status (published). Categories: Discover, Artifacts, Make music, Sound toys, Tools. Embedded experiences may request only camera and/or microphone. Existing entries retain their creator, ownership, and kind. Omitted optional fields reset to their defaults; send the complete record when updating.

IDs are globally unique, 3–80 lowercase letters, digits or hyphens. Repeating a PUT with the same id updates that creator's entry, so retries do not duplicate it. A different creator's id is rejected. Use status draft to keep it out of the public collection, then published when ready. Trusted agent keys publish directly; normal web submissions go through moderator review.

Limits: name 60 characters; description 180; about 3,000; instructions 30,000; tools_used 2,000; URLs 2,048. Body up to 64 KB; one successful write per key every two seconds.

Success (200): id, creator, status, updated_at, url (the collection permalink). Errors: 400 invalid fields, 401 missing/invalid/expired/revoked key, 403 wrong creator, 409 conflicting id, 413 body too large, 429 retry after two seconds, 502/503 temporary publishing failure. Retry with the same id. Do not include creator or owner_id in the body; identity comes from the key.

Key administration (database administrators only): run `node scripts/create-publishing-key.mjs musicnerd "Research agent"` in the project. This writes a private environment file and registration SQL containing only a SHA-256 hash. Register the hash in the Music Nerd Web Supabase project. Load the private environment file in your agent's secret store; never commit or send the key in chat. Revoke using `update mn_private.publishing_keys set revoked_at=now() where id='<key-id>';`. The private table records creator, label, expiry, and last successful use; it is not exposed to website users.
