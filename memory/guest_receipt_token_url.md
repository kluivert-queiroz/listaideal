---
name: guest-receipt-token-url
description: Planned feature — opaque-token receipt URL a guest can save/share to recall their reservation (option 2 of 2)
metadata:
  type: project
---

Planned feature (not built as of 2026-08-25). Same problem as
[[guest-receipt-local-device]]: after a guest confirms and leaves, the
reserved-gifts summary exists only in the `useActionState` result rendered by
`components/guest/selection-form.tsx`, so a refresh loses it and nothing is
persisted anywhere the guest can reach.

**Option 2 of 2 — receipt URL with an opaque token.** The durable, cross-device
escape hatch; intended to ship alongside option 1, which handles the silent
same-device case.

**Why:** survives a new browser, a cleared cache, and a new phone, and can be
shared with a spouse ("já compramos esse"). A `wa.me/?text=` share button (or the
Web Share API) on the confirmation screen does the "send it to myself" job that an
email receipt would, while storing zero contact data — which is why email is
deliberately deferred (new PII column, LGPD surface this app currently doesn't
have, an outbound provider + key, and a real abuse vector: a public form that
mails arbitrary addresses gets the domain used for spam, needing per-IP/per-list
throttling).

**How to apply:**
- Generate a receipt token per submission; surface
  `/list/[token]/recibo/[receipt]` on the confirmation screen with "salvar meu
  comprovante" plus the WhatsApp share button.
- Token entropy is the whole security story: **≥128 bits from a CSPRNG**
  (`gen_random_bytes` in Postgres, or `crypto.randomUUID()`). Do **not** reuse the
  `gen_slug()` pattern behind `lists.share_token` — 31⁵ ≈ 28M is walkable, and
  every hit is a name↔gift mapping, i.e. a direct FR-5.8 breach.
- Return an **identical 404** for invalid and unknown tokens, rate-limit the
  route, set `noindex`, and set `no-store` — per-guest data must never land in a
  CDN cache. No third-party scripts on that page.
- Read-only, which keeps it inside FR-5.7 (guests cannot edit or cancel). Expect
  it to generate "posso cancelar?" requests once guests can see their reservation
  again — product call, not a bug.
- Middle-ground variant if link loss turns out to be the real failure mode: an
  8-char human-transcribable code shown on the confirmation screen and entered
  later. Matches what guests actually do (screenshot / write it down), but ~40
  bits only — must be scoped per-list and rate-limited.

**Shared schema prerequisite (both options):** `selections` is
`(id, gift_id, guest_name, created_at)` — one row per gift with **no key tying the
rows of one submission together**. Needs either `selections.submission_id` or a
`guest_submissions` (`id, list_id, guest_name, created_at`) parent holding the
receipt token, with `claim_gift_slot` taking that id as a parameter. Store the
token hashed (sha256) for defence in depth if you like — lookup is by exact match,
so it costs nothing. That table would also be the natural parent for
`list_messages`, which currently shares no key with selections (FR-4.2 / BR-9) —
appealing consolidation, bigger migration, decide separately. The DB is in
production: add a **new** migration file, never edit past ones or `schema.sql`
alone.

**Rejected alternative — name lookup:** see [[guest-receipt-local-device]] for why
(published guest names make it an FR-5.8 breach). Stack context in
[[project-listaideal]].
