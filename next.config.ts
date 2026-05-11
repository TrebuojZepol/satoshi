import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /** Ensure SQL migration pack is present in standalone trace (Docker also copies `/drizzle`). */
  outputFileTracingIncludes: {
    "/*": ["./drizzle/postgres/**/*"],
  },
  serverExternalPackages: [
    "better-sqlite3",
    "pg",
    "bitcoinjs-lib",
    "ecpair",
    "@bitcoinerlab/secp256k1",
  ],
};

export default nextConfig;
