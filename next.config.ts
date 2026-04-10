import type { NextConfig } from "next";
import path from "path";

// GitHub Pages 배포 시에만 basePath·assetPrefix 적용 (레포 이름 /saju).
// 로컬 dev/build에서는 빈 문자열이라 루트에서 바로 동작.
const isGhPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/saju" : "",
  assetPrefix: isGhPages ? "/saju/" : "",
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
