import type { MetadataRoute } from "next";
import { colors } from "@mct/ui/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maine CyberTech Portal",
    short_name: "MCT Portal",
    description: "Managed IT services and cybersecurity platform",
    start_url: "/",
    display: "standalone",
    background_color: colors.cyber.base,
    theme_color: colors.cyber.accent,
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
