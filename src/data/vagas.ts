/* VAGAS — [ícone, nome da vaga, link do formulário]
   Ícones disponíveis: shopping-bag, graduation-cap, users, briefcase, car, wrench, palette, clipboard-list,
   paint-roller, hammer, store */

export type IconeVaga =
  | 'shopping-bag'
  | 'graduation-cap'
  | 'users'
  | 'briefcase'
  | 'car'
  | 'wrench'
  | 'palette'
  | 'clipboard-list'
  | 'paint-roller'
  | 'hammer'
  | 'store'

export interface Vaga {
  icone: IconeVaga
  nome: string
  link: string
}

// prettier-ignore
const LINHAS: [IconeVaga, string, string][] = [
  ['shopping-bag', 'Vendedora / Gerente', 'https://docs.google.com/forms/d/e/1FAIpQLSfz9_jD-SFschdQT44OoVdhD0bG0TOP0jx8TkWM8bTTzVwMDw/viewform?utm_source=ig&utm_medium=social&utm_content=link_in_bio'],
  ['graduation-cap', 'Estágio', 'https://docs.google.com/forms/d/1-jikU1rl1sifhtzvGu7PiFUF2eQGYjJ30X23VyGetUc/viewform'],
  ['users', 'Analista de RH', 'https://docs.google.com/forms/d/e/1FAIpQLSfRQQvbISShl7bSo4FRsYMVg0NaclMeMJbqNF02OQsfxotMFQ/viewform'],
  ['briefcase', 'Assistente Comercial', 'https://docs.google.com/forms/d/e/1FAIpQLSfPoLoTFRus8qWmxf7mSjJi0teqVqQql9Gbl8Dxj6ZhP97xlw/viewform'],
  ['car', 'Motorista', 'https://docs.google.com/forms/d/e/1FAIpQLSerBst866uAA_dW3rew7xJfS9rnrojLhkRdrUE41h8t25STsQ/viewform'],
  ['wrench', 'Auxiliar de Manutenção', 'https://docs.google.com/forms/d/1_tDtNo7KLHRqh-vePDFcr0f0Z0ubUEGnWDjOV1W9Pa4/viewform'],
  ['palette', 'Designer Gráfico e Videomaker', 'https://docs.google.com/forms/d/1i6aJUKuldT5d1_alXk8HJRltXabStVI3Dd0LvnHh99I/viewform'],
  ['clipboard-list', 'Assistente Administrativo', 'https://docs.google.com/forms/d/1zH3ORuozncG_DUDqCtaZzGyWZYMnJAvhe780OlTQDgs/viewform'],
  ['paint-roller', 'Pintor', 'https://docs.google.com/forms/d/1mFJltlJb2aeluuZnLiAFgbZFvDXHmYL3m9_5LeNqb_M/viewform'],
  ['hammer', 'Marceneiro', 'https://docs.google.com/forms/d/1aSWY5ZXcSkeSlz3Aav57JDuFsWSTaFS9fi0xzxkwrPc/viewform'],
]

export const VAGAS: Vaga[] = LINHAS.map(([icone, nome, link]) => ({ icone, nome, link }))
