import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@khal/utils", "@khal/types", "@khal/validations", "@khal/ui"],
};

export default withNextIntl(nextConfig);