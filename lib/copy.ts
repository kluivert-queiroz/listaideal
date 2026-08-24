/** Defaults do tema mel & abelhinha — usados quando o campo da lista vem nulo. */
export const HERO_HEADLINE_DEFAULT = 'Um pouquinho de mel está a caminho…'
export const HERO_KICKER_DEFAULT = 'Celebre conosco no chá da'

export const GIFTS_TITLE = 'Escolha com carinho'
export const giftsSubtitle = (honoree: string | null) =>
  honoree ? `Selecione um ou mais presentes para ${honoree} 🍯` : 'Selecione um ou mais presentes 🍯'

export const DETAILS_TITLE = 'Quase lá!'
export const DETAILS_SUBTITLE = 'Deixe seu nome e uma mensagem para a família.'
export const GUEST_MESSAGE_PLACEHOLDER = 'Que a chegada dela seja cheia de saúde e doçura…'
export const selectedCount = (n: number) =>
  n === 0
    ? 'Nenhum presente selecionado'
    : `${n} ${n === 1 ? 'presente selecionado' : 'presentes selecionados'} 🍯`
export const CONFIRMATION_SUBTITLE = 'Sua escolha foi registrada com carinho.'
