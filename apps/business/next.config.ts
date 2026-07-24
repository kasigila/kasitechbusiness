import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@kasitech/ui",
    "@kasitech/auth",
    "@kasitech/tenancy",
    "@kasitech/permissions",
    "@kasitech/validation",
    "@kasitech/audit",
    "@kasitech/database",
  ],
};

export default nextConfig;
