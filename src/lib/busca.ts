/** Busca do localizador: CEP, nome de loja, cidade, bairro ou endereço livre.
 *  - Sugestões enquanto digita: só com os nossos dados (lojas, cidades e bairros onde há loja) — nenhuma chamada
 *    externa (o OpenStreetMap não permite autocompletar pela API dele).
 *  - Endereço livre: OpenStreetMap (Nominatim) só quando a pessoa aperta Buscar, priorizando PE, PB e AL. */
import { LOJAS, type Loja } from '@/data/lojas'

import { pegar, type Buscar } from './cep'
import type { Ponto } from './distancia'
import { bairroCidade, cidadeDe } from './loja'
import { norm, soDigitos } from './texto'

/** "51110-160", "51110160", "51.110-160" */
export const ehCep = (texto: string) => /^\s*\d{2}\.?\d{3}[-\s]?\d{3}\s*$/.test(texto)
/** Só números (e traço/ponto): o campo aplica a máscara do CEP. */
export const pareceCep = (texto: string) => /^[\d\s.-]+$/.test(texto) && soDigitos(texto).length > 0

export type Sugestao =
  | { tipo: 'loja'; chave: string; titulo: string; sub: string; loja: Loja }
  | { tipo: 'lugar'; chave: string; titulo: string; sub: string; rotulo: string; lojas: Loja[] }
  | { tipo: 'buscar'; chave: string; titulo: string; sub: string; texto: string }

const bairroDe = (l: Loja) => {
  const partes = bairroCidade(l).split(',')
  return partes.length > 1 ? partes[0].trim() : ''
}
const qtd = (n: number) => `${n} ${n === 1 ? 'loja' : 'lojas'}`

function agrupar(lojas: Loja[], chave: (l: Loja) => string) {
  const m = new Map<string, Loja[]>()
  lojas.forEach((l) => m.set(chave(l), [...(m.get(chave(l)) ?? []), l]))
  return m
}
const CIDADES = agrupar(LOJAS, cidadeDe)
// "Centro" existe em quase toda cidade: não vira sugestão de bairro (as lojas "Centro de ..." aparecem pelo nome)
const BAIRROS = agrupar(
  LOJAS.filter((l) => bairroDe(l) && bairroDe(l) !== 'Centro'),
  (l) => `${bairroDe(l)}|${cidadeDe(l)}`,
)

/** Ponto médio de um grupo de lojas (para "lojas perto de Caruaru", por exemplo). */
export function centroDe(lojas: Loja[]): Ponto {
  return {
    lat: lojas.reduce((s, l) => s + l.lat, 0) / lojas.length,
    lng: lojas.reduce((s, l) => s + l.lng, 0) / lojas.length,
  }
}

/** Até 6 sugestões: cidades, bairros e lojas que combinam com o texto, e por último "Buscar ... no mapa". */
export function sugestoes(texto: string, max = 6): Sugestao[] {
  const t = norm(texto.trim())
  if (t.length < 2 || pareceCep(texto)) return []
  const nota = (alvo: string) => {
    const a = norm(alvo)
    if (a.startsWith(t)) return 0
    if (a.split(/[\s,()/-]+/).some((p) => p.startsWith(t))) return 1
    return a.includes(t) ? 2 : -1
  }
  const achados: { s: Sugestao; nota: number }[] = []
  CIDADES.forEach((lojas, cidade) => {
    const n = nota(cidade)
    if (n >= 0)
      achados.push({
        nota: n,
        s: {
          tipo: 'lugar',
          chave: `c:${cidade}`,
          titulo: cidade,
          sub: `Cidade · ${qtd(lojas.length)}`,
          rotulo: cidade,
          lojas,
        },
      })
  })
  BAIRROS.forEach((lojas, chave) => {
    const [bairro, cidade] = chave.split('|')
    const n = nota(bairro)
    if (n >= 0)
      achados.push({
        nota: n + 0.3,
        s: {
          tipo: 'lugar',
          chave: `b:${chave}`,
          titulo: bairro,
          sub: `Bairro de ${cidade} · ${qtd(lojas.length)}`,
          rotulo: `${bairro}, ${cidade}`,
          lojas,
        },
      })
  })
  LOJAS.forEach((l) => {
    const n = nota(l.nome)
    if (n >= 0)
      achados.push({
        nota: n + 0.5,
        s: { tipo: 'loja', chave: `l:${l.id}`, titulo: l.nome, sub: bairroCidade(l), loja: l },
      })
  })
  achados.sort((a, b) => a.nota - b.nota || a.s.titulo.localeCompare(b.s.titulo, 'pt-BR'))
  const lista = achados.slice(0, t.length >= 3 ? max - 1 : max).map((a) => a.s)
  if (t.length >= 3)
    lista.push({
      tipo: 'buscar',
      chave: `q:${t}`,
      titulo: `Buscar “${texto.trim()}” no mapa`,
      sub: 'Endereço, bairro ou cidade',
      texto: texto.trim(),
    })
  return lista
}

export class LugarNaoEncontrado extends Error {
  constructor() {
    super('Lugar não encontrado')
  }
}

// oeste, norte, leste, sul: Pernambuco, Paraíba e Alagoas (com folga)
const REGIAO_DAS_LOJAS = '-41.6,-5.9,-34.6,-10.7'

/** Endereço, bairro ou cidade → ponto no mapa. Primeiro só na região das lojas; se não achar, no Brasil todo. */
export async function geocodificar(texto: string, buscar: Buscar = fetch): Promise<Ponto & { rotulo: string }> {
  for (const naRegiao of [true, false]) {
    const q = new URLSearchParams({
      q: texto,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '1',
      countrycodes: 'br',
      'accept-language': 'pt-BR',
    })
    if (naRegiao) {
      q.set('viewbox', REGIAO_DAS_LOJAS)
      q.set('bounded', '1')
    }
    const r = await pegar(buscar, `https://nominatim.openstreetmap.org/search?${q}`, 9000)
    if (!r.ok) throw new Error('Não foi possível buscar o endereço agora')
    const j = await r.json()
    if (!Array.isArray(j) || !j.length) continue
    const a = j[0].address ?? {}
    const bairro = a.suburb || a.neighbourhood || a.quarter || a.city_district || ''
    const cidade = a.city || a.town || a.village || a.municipality || ''
    const rotulo =
      [bairro || a.road || '', cidade].filter(Boolean).join(', ') ||
      String(j[0].display_name ?? texto)
        .split(',')
        .slice(0, 2)
        .join(',')
    return { lat: Number(j[0].lat), lng: Number(j[0].lon), rotulo }
  }
  throw new LugarNaoEncontrado()
}
