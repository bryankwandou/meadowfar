import type { MetadataRoute } from "next";

// Lets kids "Add to Home Screen" on a tablet or laptop and launch Meadowfar
// like an app — full screen, its own icon, no browser chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meadowfar",
    short_name: "Meadowfar",
    description: "An endless open-world meadow for kids. Safe, free, no downloads.",
    start_url: "/play",
    display: "standalone",
    orientation: "landscape",
    background_color: "#d1fae5",
    theme_color: "#059669",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
