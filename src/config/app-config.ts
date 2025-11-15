import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "infomedia nusantara",
  version: packageJson.version,
  copyright: `© ${currentYear}, infomedia nusantara.`,
  meta: {
    title: "infomedia nusantara dashboard",
    description:
      "infomedia nusantara dashboard powered by Next.js 16, Tailwind CSS, and shadcn/ui for the Infomedia funnel experience.",
  },
};
