// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()]
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Press Start 2P",
      cssVariable: "--fontsource-press-start-2p",
    },
    {
      provider: fontProviders.fontsource(),
      name: "VT323",
      cssVariable: "--fontsource-vt323",
    }
  ],
});

// import { defineConfig, fontProviders } from "astro/config";

// export default defineConfig({
//   fonts: [{
//     provider: fontProviders.fontsource(),
//     name: "Roboto",
//     cssVariable: "--font-roboto",
//   }]
// });
