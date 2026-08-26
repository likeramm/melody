import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // 상위 디렉터리에도 lockfile 이 있어 Next 가 워크스페이스 루트를 잘못 잡는 것을 막습니다.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
