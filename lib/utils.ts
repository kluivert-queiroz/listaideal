import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Guards against a misconfigured NEXT_PUBLIC_SITE_URL (missing protocol or
// trailing slash), which would otherwise make links resolve relative to the
// current page instead of pointing at the site root.
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return withProtocol.replace(/\/+$/, '')
}
