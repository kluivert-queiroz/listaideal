export type List = {
  id: string
  owner_id: string
  title: string
  honoree_names: string | null
  headline: string | null
  kicker: string | null
  intro_message: string | null
  event_date: string | null
  event_time: string | null
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  share_token: string
  status: 'open' | 'closed'
  created_at: string
}

export type GiftCategory = {
  id: string
  list_id: string
  name: string
  display_order: number
  created_at: string
}

export type Gift = {
  id: string
  list_id: string
  name: string
  description: string | null
  image_url: string | null
  store_url: string | null
  price: number | null
  category_id: string | null
  max_count: number
  display_order: number
  created_at: string
}

export type GiftWithSlots = Gift & {
  slots_used: number
}

export type Selection = {
  id: string
  gift_id: string
  guest_name: string
  created_at: string
}

export type SelectionWithGift = Selection & {
  gifts: Pick<Gift, 'name'>
}

export type ListMessage = {
  id: string
  list_id: string
  guest_name: string
  message: string
  is_hidden: boolean
  created_at: string
}

/**
 * The only shape ever sent to the public guest page. Omits list_id and is_hidden —
 * and there is no gift field to omit (FR-5.8).
 */
export type PublicMessage = Pick<ListMessage, 'id' | 'guest_name' | 'message' | 'created_at'>

export type Rsvp = {
  id: string
  list_id: string
  guest_name: string
  is_attending: boolean
  guest_count: number
  created_at: string
  updated_at: string
}

export type ActionState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | undefined
