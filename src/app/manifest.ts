import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bıcırıklar Kids",
    short_name: "Bıcırıklar",
    description: "Çocuklar için keçe dikiş kitleri ve eğitici aktivite setleri",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfdff",
    theme_color: "#0067d1",
    lang: "tr",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/brand/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
