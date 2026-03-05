import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_IN_DEV === "true";

const withPWA = withPWAInit({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" && !enablePwaInDev,
  register: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  output: "standalone",
};

export default withPWA(nextConfig);
