/** Shared by the browser and the read endpoint. Vercel caps request bodies at 4.5 MB. */
export const READ_BODY_BUDGET = 4_000_000;
/** Reading copies are smaller than the photos kept for saving. */
export const READ_LONG_EDGE = 1600;
export const READ_JPEG_QUALITY = 0.8;
/**
 * Most reads take a few seconds. Recipes over 3 pages may wait for the free Groq per-minute
 * limit, so the member can wait up to two minutes; the server gives up a little earlier.
 */
export const READ_CLIENT_TIMEOUT_MS = 120_000;
export const READ_SERVER_TIMEOUT_MS = 110_000;
