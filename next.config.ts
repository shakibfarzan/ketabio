import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'red-calm-bat-318.mypinata.cloud',
      },
    ],
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*\.(js|css|woff2|png|jpg|jpeg|svg|gif)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export default withNextIntl(withPWA(nextConfig) as NextConfig);
