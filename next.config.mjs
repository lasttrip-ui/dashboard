/** @type {import('next').NextConfig} */

// When building for GitHub Pages we export a fully static site under the
// repository sub-path (https://<owner>.github.io/dashboard/). Local `dev`,
// `build` and `start` are unaffected.
const isPages = process.env.GITHUB_PAGES === "true"

const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        output: "export",
        basePath: "/dashboard",
        assetPrefix: "/dashboard/",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
}

export default nextConfig
