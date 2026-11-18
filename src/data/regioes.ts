/* REGIÕES da lista completa — como o cliente pensa o mapa (não a divisão oficial à risca).
   Loja nova numa cidade que ainda não está aqui? Acrescente a cidade em CIDADES (o teste avisa se faltar). */
import { cidadeDe } from '@/lib/loja'

import type { Loja, UF } from './lojas'

export type Regiao = 'rmr' | 'mata' | 'agreste' | 'sertao' | 'pb' | 'al'

export const REGIOES: { id: Regiao; nome: string; uf: UF }[] = [
  { id: 'rmr', nome: 'Recife e Região Metropolitana', uf: 'PE' },
  { id: 'mata', nome: 'Zona da Mata', uf: 'PE' },
  { id: 'agreste', nome: 'Agreste', uf: 'PE' },
  { id: 'sertao', nome: 'Sertão', uf: 'PE' },
  { id: 'pb', nome: 'Paraíba', uf: 'PB' },
  { id: 'al', nome: 'Alagoas', uf: 'AL' },
]

// cidades de Pernambuco → região (Paraíba e Alagoas vão pelo estado)
const CIDADES: Record<string, Regiao> = {
  Recife: 'rmr',
  Olinda: 'rmr',
  Paulista: 'rmr',
  'Jaboatão dos Guararapes': 'rmr',
  Camaragibe: 'rmr',
  'São Lourenço da Mata': 'rmr',
  'Abreu e Lima': 'rmr',
  Igarassu: 'rmr',
  'Cabo de Santo Agostinho': 'rmr',
  Ipojuca: 'rmr',
  Moreno: 'rmr',
  Goiana: 'mata',
  Carpina: 'mata',
  Escada: 'mata',
  'Vitória de Santo Antão': 'mata',
  Caruaru: 'agreste',
  Garanhuns: 'agreste',
  Gravatá: 'agreste',
  'Belo Jardim': 'agreste',
  Surubim: 'agreste',
  Arcoverde: 'sertao',
  'Serra Talhada': 'sertao',
  'Afogados da Ingazeira': 'sertao',
}

export function regiaoDe(l: Loja): Regiao | undefined {
  if (l.uf === 'PB') return 'pb'
  if (l.uf === 'AL') return 'al'
  return CIDADES[cidadeDe(l)]
}
