import { handle } from "../../_lib/http.js";
import { saveAnalyticsEvent } from "./track.js";

const PIXEL = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255,
  33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59
]);

export async function onRequestGet(context) {
  return handle(async () => {
    const url = new URL(context.request.url);
    const body = Object.fromEntries(url.searchParams.entries());

    await saveAnalyticsEvent(context, body);

    return new Response(PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store"
      }
    });
  });
}
