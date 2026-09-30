# Provider decision system

The application uses two deliberately small decision chains.

## Data

`AniList identity/details → Jikan fills missing metadata → Anikoto adds Chinese episode availability`

- AniList IDs remain canonical, preventing duplicate anime records.
- Jikan is queried by AniList's verified MyAnimeList ID and cannot overwrite populated AniList fields.
- Anikoto is consulted only for `countryOfOrigin: CN`; its `ani_id` must exactly match the AniList ID.
- A positive Anikoto SUB episode count is release evidence. It can correct a stale `NOT_YET_RELEASED` status and supplies the latest aired episode, but it cannot replace AniList identity or artwork.
- If a provider fails, the last verified result remains usable and the page does not invent data.

## Playback

`valid saved choice → exact Chinese Server 3 → Server 1 → Server 2`

- Server 3 is always shown in the SUB server row. It plays only when the exact episode has a validated Anikoto embed; otherwise it reports that the source is unavailable instead of loading an unsafe or invented URL.
- DUB Server 3 remains hidden until that exact episode has a confirmed DUB source.
- A failed server advances to the next available server without changing the episode.
- Embed URLs are generated or accepted only through provider-specific validation; arbitrary iframe URLs are rejected.
