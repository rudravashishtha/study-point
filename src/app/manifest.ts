import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/server/services/site-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settingsResult = await getSiteSettings();
  const name = settingsResult.success ? settingsResult.data.instituteName : "Study Point";
  const description =
    settingsResult.success && settingsResult.data.defaultDescription
      ? settingsResult.data.defaultDescription
      : "A trusted coaching institute for Classes IX-XII, focused on structured learning, personal guidance, and steady academic growth.";

  return {
    name,
    short_name: name,
    description,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
