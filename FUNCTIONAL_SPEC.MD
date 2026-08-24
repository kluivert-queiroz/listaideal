# Functional Specification — ListaIdeal (Wedding Gift List)

**Status:** Draft
**Last updated:** 2026-08-24

---

## 1. Overview

ListaIdeal is a web application that lets a person (the **owner**) create a list of
gifts they would like to receive from invited people. The owner shares a public link,
and **guests** open it to browse the available gifts, select one or more, leave their
name and a message, and submit their choice.

Each gift has a maximum number of times it can be selected. When that maximum is
reached, the gift is **hidden** — no remaining guest can see or select it.

### 1.1 Goals

- Let an owner create and manage a gift list with minimal friction.
- Let guests reserve gifts through a simple, no-login link.
- Prevent over-selection by enforcing per-gift selection limits.
- Give the owner full visibility into who selected what and the messages left.

### 1.2 Non-goals (this version)

- No payment, purchasing, or money collection of any kind.
- No email/push notifications.
- No multi-language support (single language for now).
- No guest accounts or guest login.
- No shipping/address management.

---

## 2. Actors

| Actor | Description | Authentication |
|-------|-------------|----------------|
| **Owner** | Creates and manages one or more gift lists. | Email + password account. |
| **Guest** | Invited person who opens a shared list and selects gifts. | None (anonymous, link-based). |

---

## 3. Core Concepts

- **List** — A collection of gifts owned by one owner, plus customization (title,
  message, couple names, event date). Reached publicly through a unique share link.
- **Gift** — An item on a list with a name, optional image, optional store link, and a
  **maximum selection count**.
- **Selection** — A guest's reservation of a single slot of a gift. Carries the guest's
  name.
- **Message** — Text a guest leaves alongside a submission. Belongs to the **list**, not
  to any specific gift, and is shown publicly with the guest's name (see FR-5.9).
- **Slot** — One unit of a gift's maximum count. A gift with `max = 3` has 3 slots.
  Each guest selection consumes exactly **one** slot.

---

## 4. Functional Requirements

### 4.1 Owner — Account

- **FR-1.1** An owner can register with email + password.
- **FR-1.2** An owner can log in and log out.
- **FR-1.3** An owner can recover access via a password-reset flow.
- **FR-1.4** An owner can have multiple lists under one account.

### 4.2 Owner — List management

- **FR-2.1** An owner can create a list with the following customization:
  - List title (required).
  - Couple names (optional).
  - Welcome/intro message (optional).
  - Event date (optional).
- **FR-2.2** An owner can edit the customization at any time, including after the list
  has been shared.
- **FR-2.3** Each list has a unique, hard-to-guess public **share link**.
- **FR-2.4** An owner can delete a list. Deleting a list invalidates its share link and
  removes all its gifts and selections.
- **FR-2.5** An owner can mark a list as **closed**. A closed list shows guests a
  read-only "this list is no longer accepting selections" state.

### 4.3 Owner — Gift management

- **FR-3.1** An owner can add a gift with:
  - Name (required).
  - Maximum selection count (required, integer ≥ 1; default 1).
  - Image (optional — uploaded file or image URL).
  - Store link / reference URL (optional).
  - Description (optional).
- **FR-3.2** An owner can edit a gift's fields.
- **FR-3.3** An owner can delete a gift. Deleting removes its existing selections.
- **FR-3.4** An owner can **increase** a gift's maximum count at any time (this may
  re-expose a previously hidden gift).
- **FR-3.5** An owner can **decrease** a gift's maximum count, but **not below the
  number of slots already selected**. (See open question OQ-2.)
- **FR-3.6** An owner can reorder gifts within the list (display order).

### 4.4 Owner — Visibility

- **FR-4.1** For each gift, the owner can see:
  - Slots used vs. total (e.g. "2 of 3 selected").
  - Whether the gift is currently hidden (max reached).
- **FR-4.2** For each selection, the owner can see the guest's **name** and
  **timestamp**. (Messages are shown separately — see FR-4.4 — since a message
  belongs to the list, not to any one selection; see BR-9.)
- **FR-4.3** The owner can view all selections for a list in one place.
- **FR-4.4** The owner can **hide** or **unhide** an individual guest message. A
  hidden message is never shown on the public page (see FR-5.9); the owner still
  sees it, marked as hidden.

### 4.5 Guest — Browsing & selecting

- **FR-5.1** Opening a valid share link shows the list's customization (title, couple
  names, message, date) and all **available** gifts.
- **FR-5.2** A gift is **available** to guests only while it has at least one free slot.
  A gift whose max is reached is **not shown** to guests at all (not listed, not
  selectable).
- **FR-5.3** A guest can select **one or more** gifts in a single visit.
- **FR-5.4** Before submitting, the guest provides:
  - Their **name** (required).
  - A **message** (optional) — applies to the submission.
- **FR-5.5** On submit, each selected gift consumes **one slot**.
- **FR-5.6** After submitting, the guest sees a confirmation of what they reserved.
- **FR-5.7** Guests **cannot** edit or cancel a selection after submitting.
- **FR-5.8** Guests do **not** see who else selected gifts, which gifts any other guest
  chose, or how many slots remain (only that a gift is available or absent). Guest
  **names and messages** are shown publicly (FR-5.9); what stays private is the
  **name↔gift mapping**. (See open question OQ-3.)
- **FR-5.9** The public list page shows a **"Mensagens de carinho"** section: a
  carousel of the most recent guest messages, plus a modal ("Ver todas") listing all
  of them. Each card/row shows only the guest's **name** and **message** — never the
  gift(s) they chose, reinforcing FR-5.8. The section is hidden entirely when there
  are no visible messages.
- **FR-5.10** The "Mensagens de carinho" section remains visible on a **closed**
  list — FR-2.5 stops new *selections*, not the display of existing messages.

### 4.6 Selection integrity

- **FR-6.1** Slot counting must be safe under concurrent guests: if two guests try to
  take the last slot of a gift at the same time, only one succeeds.
- **FR-6.2** If a gift becomes full between the moment a guest loads the page and the
  moment they submit, the submission for that specific gift fails gracefully:
  - The guest is told that gift is no longer available.
  - Any other still-available gifts in the same submission are still reserved.
  - (See open question OQ-4 for all-or-nothing vs. partial behavior.)

---

## 5. Key User Flows

### 5.1 Owner creates and shares a list

1. Owner registers / logs in.
2. Owner creates a list and fills in title and optional customization.
3. Owner adds gifts (name, max count, optional image/link/description).
4. Owner copies the share link and sends it to guests (outside the app).

### 5.2 Guest reserves gifts

1. Guest opens the share link.
2. Guest sees the welcome info and all available gifts.
3. Guest selects one or more gifts.
4. Guest enters their name and an optional message.
5. Guest submits.
6. System reserves one slot per selected gift and shows a confirmation.
7. Any gift that reached its max as a result becomes hidden for future guests.
8. If the guest left a message and reserved at least one gift (BR-7), the message
   appears in the public "Mensagens de carinho" section (FR-5.9) — with the guest's
   name, but never the gift(s) they chose.

### 5.3 Owner reviews selections

1. Owner logs in and opens the list.
2. Owner sees per-gift slot usage and the full list of selections (name, timestamp),
   plus the full list of guest messages (name, message, timestamp), and can hide/unhide
   any message.

---

## 6. Business Rules

- **BR-1** A gift's maximum selection count is an integer ≥ 1.
- **BR-2** A gift is visible to guests **iff** `slots_used < max_count` **and** the
  list is not closed.
- **BR-3** Each guest submission consumes exactly one slot per selected gift.
- **BR-4** Selections are immutable from the guest's side once submitted.
- **BR-5** The owner's max-count cannot be set below the current `slots_used`.
- **BR-6** Share links must be unguessable (e.g. a random token), since there is no
  guest authentication.
- **BR-7** A message is recorded only when the guest supplied non-empty text **and**
  successfully reserved at least one gift. A guest who reserved nothing (e.g. every
  selected gift was already full) leaves no message, even if they typed one.
- **BR-8** A hidden message (FR-4.4) is never returned to the public page.
- **BR-9** A message belongs to a **list**, not to a gift; one guest submission
  produces exactly one message, regardless of how many gifts it reserved.

---

## 7. Data Model (conceptual)

> Conceptual only — not a schema. Field types/constraints are defined at implementation.

- **Owner**: `id`, `email`, `password_hash`, `created_at`.
- **List**: `id`, `owner_id`, `title`, `couple_names`, `intro_message`,
  `event_date`, `share_token`, `status` (open|closed), `created_at`.
- **Gift**: `id`, `list_id`, `name`, `description`, `image`, `store_url`,
  `max_count`, `display_order`, `created_at`.
- **Selection**: `id`, `gift_id`, `guest_name`, `created_at`.
  - `slots_used` for a gift = count of its selections.
  - No longer carries `message` — see **Message** below (BR-9).
- **Message**: `id`, `list_id`, `guest_name`, `message`, `is_hidden`, `created_at`.
  Deliberately has no `gift_id`: since a message is about the list rather than any
  one gift, guests can never be tied to the gift(s) they chose through it (FR-5.8).

---

## 8. Validation & Error Handling

- Required fields (list title, gift name, gift max count, guest name) are validated
  before save/submit.
- Gift max count must be a positive integer.
- Opening an invalid/expired/deleted share link shows a friendly "list not found" page.
- Submitting a selection for a now-full gift shows a clear, non-technical message.
- Image uploads are restricted by type and size (limits TBD at implementation).

---

## 9. Out of Scope (future ideas)

- Email notifications to owner on each selection, and confirmation emails to guests.
- Guest ability to cancel/release a reserved gift.
- Per-guest quantity (a guest taking more than one slot of the same gift).
- Multi-language / internationalization.
- Public visibility of "X of Y already taken" to guests.
- Group gifting / contributions toward a single expensive gift.
- Analytics dashboard for the owner.

---

## 10. Open Questions

- **OQ-1** Should there be any limit on the number of gifts per list or lists per owner?
- **OQ-2** When the owner decreases a gift's max count, is blocking below `slots_used`
  acceptable, or should the owner be able to remove specific existing selections first?
- **OQ-3** Confirmed for now that guests don't see remaining counts — do we want to show
  at least a subtle "limited availability" hint, or keep it fully hidden?
- **OQ-4** On a multi-gift submission where one gift just went full: confirm partial
  success (reserve the rest) is preferred over all-or-nothing.
- **OQ-5** Should a closed/deleted list keep historical selections visible to the owner
  indefinitely, or be purged?
- **OQ-6** Any abuse/spam protection needed on the public guest form (e.g. rate limiting,
  captcha)? **Raised in priority as of FR-5.9**: guest-submitted text is now rendered on
  the public page, not just seen privately by the owner. Current mitigations are BR-7
  (a message requires a successful reservation, so the message rate is capped by the
  number of free gift slots) and FR-4.4 (owner can hide any message after the fact).
  Still open: share-link entropy is unchanged from what it was when a guessed link only
  exposed gift selection.
