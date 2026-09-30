# Provider decision system

The application uses two deliberately small decision chains.

## Data

`AniList identity/details → Jikan fills missing metadata → Anikoto adds Chinese episode availability`

- AniList IDs remain canonical, preventing duplicate anime records.
- Jikan is queried by AniList's verified MyAnimeList ID and cannot overwrite populated AniList fields.
- Anikoto is consulted only for `countryOfOrigin: CN`; its `ani_id` must exactly match the AniList ID.
- If a provider fails, the last verified result remains usable and the page does not invent data.

## Playback

`valid saved choice → exact Chinese Server 3 → Server 1 → Server 2`

- Server 3 exists only when the exact episode and SUB/DUB track has a validated Anikoto embed.
- Non-Chinese anime never receive Server 3.
- A failed server advances to the next available server without changing the episode.
- Embed URLs are generated or accepted only through provider-specific validation; arbitrary iframe URLs are rejected.
