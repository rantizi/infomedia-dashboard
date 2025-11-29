import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Infomedia Nusantara",
  version: packageJson.version,
  copyright: `(c) ${currentYear}, Infomedia Nusantara.`,
  meta: {
    title: "Infomedia Nusantara Dashboard",
    description:
      "Infomedia Nusantara dashboard powered by Next.js 16, Tailwind CSS, and shadcn/ui for the Infomedia funnel experience.",
  },
};
