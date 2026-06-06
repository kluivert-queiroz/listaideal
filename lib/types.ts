export type List = {
  id: string
  owner_id: string
  title: string
  couple_names: string | null
  intro_message: string | null
  event_date: string | null
  share_token: string
  status: 'open' | 'closed'
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
  message: string | null
  created_at: string
}

export type SelectionWithGift = Selection & {
  gifts: Pick<Gift, 'name'>
}

export type ActionState =
  | { error: string; success?: never }
  | { success: string; error?: never }
  | undefined
