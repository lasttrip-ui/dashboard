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
        // The serverless API routes (app/api/**/route.ts) only run on Vercel —
        // they're `force-dynamic` and can't be statically exported, which would
        // otherwise abort this build. Dropping "ts" from the recognized route
        // extensions excludes them from the static export, while every page
        // (all .tsx) is still included. The client degrades gracefully when the
        // API isn't reachable (see lib/sync.ts and hooks/use-live-quotes.ts).
        pageExtensions: ["tsx", "jsx", "js"],
      }
    : {}),
}

export default nextConfig
