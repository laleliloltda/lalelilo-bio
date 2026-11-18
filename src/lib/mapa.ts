/** Tipos compartilhados com o mapa (o mapa em si é carregado à parte; estes tipos não puxam o arquivo dele). */
import type { Loja } from '@/data/lojas'

export interface MarcadorLoja {
  loja: Loja
  numero: number
  distancia: number
}

/** Para onde o mapa olha na visão geral: todas as lojas ou uma loja. */
export type Alvo = { tipo: 'tudo' } | { tipo: 'loja'; id: number }

/** O "vez" muda a cada pedido, para repetir o mesmo alvo (ex.: escolher de novo a mesma loja). */
export type Foco = Alvo & { vez: number }
