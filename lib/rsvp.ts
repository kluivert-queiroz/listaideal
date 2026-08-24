export const RSVP_TITLE = 'Confirme sua presença'
export const RSVP_SUBTITLE = 'Conte pra gente se você vai participar.'
export const RSVP_NAME_LABEL = 'Seu nome'
export const RSVP_ATTENDING_YES_LABEL = 'Vou'
export const RSVP_ATTENDING_NO_LABEL = 'Não vou'
export const RSVP_GUEST_COUNT_LABEL = 'Quantas pessoas confirmam, incluindo você?'
export const RSVP_SUBMIT_LABEL = 'Confirmar'
export const RSVP_SUBMIT_PENDING_LABEL = 'Enviando…'
export const RSVP_EMPTY_OWNER = 'Nenhuma confirmação ainda.'

export const RSVP_EDIT_TITLE = 'Editar RSVP'
export const RSVP_EDIT_SAVE_LABEL = 'Salvar alterações'
export const RSVP_EDIT_SAVE_PENDING_LABEL = 'Salvando…'
export const RSVP_DELETE_LABEL = 'Excluir'
export const RSVP_UPDATED_SUCCESS = 'RSVP atualizado.'
export const RSVP_DUPLICATE_NAME_ERROR = 'Já existe uma confirmação com esse nome.'

export function rsvpDeleteConfirm(guestName: string): string {
  return `Excluir a confirmação de ${guestName}? Essa ação não pode ser desfeita.`
}

export const RSVP_MIN_GUEST_COUNT = 1
export const RSVP_MAX_GUEST_COUNT = 20

export function rsvpConfirmationMessage(guestName: string, isAttending: boolean): string {
  return isAttending
    ? `Que alegria, ${guestName}! Sua presença está confirmada.`
    : `Obrigado por avisar, ${guestName}. Sentiremos sua falta!`
}

/** Owner-page summary line above the RSVP list. */
export function rsvpSummary(confirmed: number, totalGuests: number, declined: number): string {
  const parts = [
    `${confirmed} ${confirmed === 1 ? 'confirmado' : 'confirmados'}`,
    `${totalGuests} ${totalGuests === 1 ? 'pessoa no total' : 'pessoas no total'}`,
  ]
  if (declined > 0) {
    parts.push(`${declined} ${declined === 1 ? 'não vai' : 'não vão'}`)
  }
  return parts.join(' · ')
}
