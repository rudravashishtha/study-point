/// <reference lib="esnext" />
/// <reference lib="webworker" />
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  // ---- EXCLUSIONS (evaluated first) ----

  // Supabase auth/storage endpoints — never cache
  {
    matcher: ({ url: { origin } }) => origin.includes("supabase.co"),
    handler: new NetworkOnly(),
  },

  // Authenticated portal pages — never cache
  {
    matcher: ({ request, url: { pathname } }) =>
      request.destination === "document" &&
      (pathname.startsWith("/admin/") ||
        pathname.startsWith("/student/") ||
        pathname.startsWith("/teacher/")),
    handler: new NetworkOnly(),
  },

  // API routes — never cache
  {
    matcher: ({ url: { pathname } }) => pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },

  // /announcements — live content, never cache
  {
    matcher: ({ request, url: { pathname } }) =>
      request.destination === "document" && pathname.startsWith("/announcements"),
    handler: new NetworkOnly(),
  },

  // ---- STATIC ASSETS (by request.destination) ----

  // Fonts — CacheFirst (immutable)
  {
    matcher: ({ request }) => request.destination === "font",
    handler: new CacheFirst({
      cacheName: "fonts",
      plugins: [
        new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      ],
    }),
  },

  // Stylesheets — StaleWhileRevalidate
  {
    matcher: ({ request }) => request.destination === "style",
    handler: new StaleWhileRevalidate({
      cacheName: "styles",
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },

  // Images — StaleWhileRevalidate
  {
    matcher: ({ request }) => request.destination === "image",
    handler: new StaleWhileRevalidate({
      cacheName: "images",
      plugins: [
        new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      ],
    }),
  },

  // Next.js static JS — CacheFirst (content-hashed)
  {
    matcher: ({ request, url: { pathname } }) =>
      request.destination === "script" && pathname.startsWith("/_next/static"),
    handler: new CacheFirst({
      cacheName: "next-static-js",
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },

  // ---- NEXT DATA PREFETCH (non-API) ----
  {
    matcher: ({ url: { pathname } }) =>
      /^\/_next\/data\/.+\.json$/.test(pathname) && !pathname.startsWith("/api/"),
    handler: new NetworkFirst({
      cacheName: "next-data",
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },

  // ---- PUBLIC PAGE NAVIGATIONS (document only) ----
  // Exclusions above already block /admin /student /teacher /announcements,
  // so this safely covers public ISR pages (/, /about, /courses, /resources, /contact, /admissions).
  {
    matcher: ({ request, sameOrigin }) =>
      request.destination === "document" && sameOrigin,
    handler: new NetworkFirst({
      cacheName: "public-pages",
      plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    }),
  },

  // ---- FALLBACK ----
  {
    matcher: /.*/i,
    method: "GET" as const,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
