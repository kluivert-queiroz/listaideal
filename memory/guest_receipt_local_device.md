---
name: guest-receipt-local-device
description: Planned feature — device-local receipt so a returning guest sees what they already reserved (option 1 of 2)
metadata:
  type: project
---

Planned feature (not built as of 2026-08-25). Problem: after a guest confirms a
selection and leaves, the reserved-gifts summary is gone forever. It lives only in
the `useActionState` result rendered by `components/guest/selection-form.tsx`
(confirmation branch) — a refresh loses it, and nothing is persisted anywhere the
guest can reach. Guests are anonymous (no auth, link-only), so there is no account
to hang the history off.

**Option 1 of 2 — device-local receipt.** The cheap path, meant to ship first and
alone if only one thing gets done. Companion durable path:
[[guest-receipt-token-url]]. Both sit on the same schema prerequisite below.

**Why:** covers the dominant real case — same person reopening the same WhatsApp
link on the same phone — with no new PII, no new backend surface, and no new
attack surface (it is the guest's own data on the guest's own device). Highest
ratio of problem solved to risk added.

**How to apply:**
- On successful submit, persist `{ list_token, gift_ids, guest_name, timestamp }`
  client-side. Store **gift ids, not names**; resolve names server-side on
  re-render so a renamed/edited gift doesn't show stale text.
- On revisit to `/list/[token]`, show a banner: "Você já reservou: X, Y" (pt-BR UI
  throughout, per [[project-listaideal]]).
- `localStorage` is simplest but renders only after hydration → brief flash. A
  cookie scoped to the list path is readable in the RSC pass of
  `app/list/[token]/page.tsx`, so the banner renders server-side with no flash.
  `httpOnly` is unnecessary (display data); keep the payload small.
- Treat it strictly as a **display hint, never as proof**. It is client-controlled;
  no authorization decision may depend on it.
- Known limits, accepted: lost on a different browser, cleared storage, private
  mode, or a new phone. That's what [[guest-receipt-token-url]] is for.
- Pair it with a nudge on the confirmation screen ("tire um print desta tela").

**Shared schema prerequisite (both options):** `selections` is
`(id, gift_id, guest_name, created_at)` — one row per gift with **no key tying the
rows of one submission together**, so "what did I reserve" is not expressible
today. Needs either `selections.submission_id` or a `guest_submissions`
(`id, list_id, guest_name, created_at`) parent, with `claim_gift_slot` taking that
id as a parameter. That table would also be the natural parent for
`list_messages`, which currently shares no key with selections (FR-4.2 / BR-9) —
appealing consolidation, bigger migration, decide separately. The DB is in
production: add a **new** migration file, never edit past ones or `schema.sql`
alone.

**Rejected alternative — name lookup** ("digite seu nome → veja seus presentes").
Straight FR-5.8 violation: guest names are already published in the Mensagens de
carinho carousel (`app/list/[token]/page.tsx`), so any guest reads a name off the
carousel and gets that person's gift list. IDOR with a publicly-listed
human-readable key. Adding a PIN kills the UX that made it attractive and leaves
guest PINs in the DB. Do not build this.
