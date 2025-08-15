import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 배포를 막는 ESLint 에러를 무시하고 빌드를 진행합니다.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 오류가 있어도 배포 빌드를 진행합니다.
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif','image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'godomall-storage.cdn-nhncommerce.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-saas-web-203-48.cdn-nhncommerce.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'modoouniform.com',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
