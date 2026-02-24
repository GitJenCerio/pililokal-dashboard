/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["xlsx"],
    // Avoid "Unable to snapshot resolve dependencies" on Windows
    webpackMemoryCache: false,
  },
  // Redirect /admin* to /dashboard so those URLs don't 404
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/dashboard", destination: "/dashboard", permanent: false },
      { source: "/admin/settings", destination: "/dashboard", permanent: false },
    ];
  },
};

module.exports = nextConfig;
