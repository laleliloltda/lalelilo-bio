/** Tipos compartilhados com o mapa (o mapa em si é carregado à parte; estes tipos não puxam o arquivo dele). */
import type { Loja } from '@/data/lojas'
import type { Regiao } from '@/data/regioes'

export interface MarcadorLoja {
  loja: Loja
  numero: number
  distancia: number
}

/** Para onde o mapa olha na visão geral: todas as lojas, uma região ou uma loja. */
export type Alvo = { tipo: 'tudo' } | { tipo: 'regiao'; id: Regiao } | { tipo: 'loja'; id: number }

/** O "vez" muda a cada pedido, para repetir o mesmo alvo (ex.: tocar duas vezes na mesma região). */
export type Foco = Alvo & { vez: number }
