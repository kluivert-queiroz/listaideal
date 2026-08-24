---
name: project-listaideal
description: Tech stack, architecture decisions, and deployment plan for the ListaIdeal wedding gift list app
metadata:
  type: project
---

Wedding gift list app. Stack decided and implemented:
- Next.js 16.2.6 (App Router, Turbopack)
- Supabase (Postgres + Auth)
- shadcn/ui (Nova preset) + Tailwind v4
- Vercel for deployment (best free tier)
- URL-only images (no file upload)

Design direction chosen: "Aconchegante & Manuscrito" (blush/pêssego palette).
- Fonts: Quicksand (body, `--font-sans`) + Dancing Script (script headings, `--font-dancing` → `font-script`/`font-serif` utilities)
- Palette set via shadcn tokens in :root (globals.css): primary #c16e72 (rose-deep), secondary #f6d9d2 (blush), bg #fdf4f0, ink #5a4642
- Helper classes in globals.css: `.bg-romantic` (layered pastel radial gradient), `.btn-romantic` (rose→peach gradient CTA)
- Guest gift cards use a wax-seal heart (♥) as the selection indicator; heart divider in header
- Admin titles use font-script + text-primary; admin body stays Quicksand for legibility
- UI language is pt-BR throughout. Mockups of 4 explored directions live in /mockups/ (option 3 was picked)

**Why:** Owner chose free-tier priority; Vercel is purpose-built for Next.js at no cost. Supabase free tier covers DB + auth.

**How to apply:** When adding features, respect this stack. No file upload storage needed (URL-only for images).

Key implementation notes:
- `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed it
- Service role key used server-side for guest operations (no guest auth)
- `claim_gift_slot` SQL function provides atomic slot reservation (FOR UPDATE lock)
- `NEXT_PUBLIC_SITE_URL` env var needed for share links and password reset redirect
- A guest message belongs to the **list**, not to a gift — stored in its own
  `list_messages` table (`id`, `list_id`, `guest_name`, `message`, `is_hidden`,
  `created_at`), not on `selections`. One guest submission produces exactly one
  message row regardless of how many gifts it reserved. Chosen over grouping
  duplicated per-gift rows in TypeScript (see [[keep-business-logic-in-code-not-db]])
  because fixing the schema's grain removed the need for grouping logic entirely,
  and because the row having no `gift_id` makes the guest↔gift privacy rule
  (FR-5.8) structurally impossible to leak rather than merely policy-enforced.
  Public page renders these in a "Mensagens de carinho" carousel + "Ver todas"
  modal; owner dashboard can hide/unhide individual messages.

Setup steps not yet done (user must do these):
1. Create Supabase project, run `supabase/schema.sql` in SQL editor
2. Copy `.env.local.example` → `.env.local` and fill in keys
3. Set `NEXT_PUBLIC_SITE_URL` in Vercel env vars
4. Deploy to Vercel (connect GitHub repo)
