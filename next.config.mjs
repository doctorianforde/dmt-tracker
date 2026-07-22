/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin (via jwks-rsa -> jose) breaks when Turbopack bundles it for
  // the serverless function — ERR_REQUIRE_ESM at runtime on Vercel. Excluding
  // it here leaves it to Node's own module resolution instead.
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
