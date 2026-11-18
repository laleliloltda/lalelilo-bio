/** Do CEP ao ponto no mapa, só com serviços gratuitos que aceitam chamadas do navegador:
 *  1) AwesomeAPI — já devolve latitude/longitude (a maioria dos CEPs);
 *  2) ViaCEP (base dos Correios) — confirma se o CEP existe e dá o endereço;
 *  3) OpenStreetMap — acha a rua (ou o centro da cidade) desse endereço;
 *  4) BrasilAPI — só se os dois primeiros estiverem fora do ar.
 *  CEP inexistente (AwesomeAPI e ViaCEP dizem que não existe) → CepNaoEncontrado. */
import type { Ponto } from './distancia'

export interface Lugar extends Ponto {
  rua: string
  bairro: string
  cidade: string
  uf: string
}

export class CepNaoEncontrado extends Error {
  constructor() {
    super('CEP não encontrado')
  }
}

const UF_NOME: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

type Buscar = typeof fetch

async function pegar(buscar: Buscar, url: string, ms: number) {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), ms)
  try {
    return await buscar(url, { signal: c.signal })
  } finally {
    clearTimeout(t)
  }
}

const coord = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) && n !== 0 ? n : null
}

export async function localizarCep(cep: string, buscar: Buscar = fetch): Promise<Lugar> {
  let endereco: Omit<Lugar, 'lat' | 'lng'> | null = null
  let awesomeNaoAchou = false
  let viaCepNaoAchou = false

  try {
    const r = await pegar(buscar, `https://cep.awesomeapi.com.br/json/${cep}`, 7000)
    if (r.ok) {
      const j = await r.json()
      endereco = { rua: j.address ?? '', bairro: j.district ?? '', cidade: j.city ?? '', uf: j.state ?? '' }
      const lat = coord(j.lat)
      const lng = coord(j.lng)
      if (lat && lng) return { ...endereco, lat, lng }
    } else if (r.status === 404 || r.status === 400) awesomeNaoAchou = true
  } catch {
    /* fora do ar ou demorou: segue para o próximo */
  }

  if (!endereco) {
    try {
      const r = await pegar(buscar, `https://viacep.com.br/ws/${cep}/json/`, 7000)
      if (r.ok) {
        const j = await r.json()
        if (j.erro) viaCepNaoAchou = true
        else endereco = { rua: j.logradouro ?? '', bairro: j.bairro ?? '', cidade: j.localidade ?? '', uf: j.uf ?? '' }
      }
    } catch {
      /* segue */
    }
  }

  if (!endereco && awesomeNaoAchou && viaCepNaoAchou) throw new CepNaoEncontrado()

  if (!endereco) {
    try {
      const r = await pegar(buscar, `https://brasilapi.com.br/api/cep/v2/${cep}`, 7000)
      if (r.ok) {
        const j = await r.json()
        endereco = { rua: j.street ?? '', bairro: j.neighborhood ?? '', cidade: j.city ?? '', uf: j.state ?? '' }
        const lat = coord(j.location?.coordinates?.latitude)
        const lng = coord(j.location?.coordinates?.longitude)
        if (lat && lng) return { ...endereco, lat, lng }
      } else if (r.status === 404) throw new CepNaoEncontrado()
    } catch (e) {
      if (e instanceof CepNaoEncontrado) throw e
    }
  }

  if (endereco?.cidade) {
    const tentativas = endereco.rua ? [true, false] : [false]
    for (const comRua of tentativas) {
      const q = new URLSearchParams({ format: 'jsonv2', limit: '1', countrycodes: 'br', city: endereco.cidade })
      if (UF_NOME[endereco.uf]) q.set('state', UF_NOME[endereco.uf])
      if (comRua) q.set('street', endereco.rua)
      try {
        const r = await pegar(buscar, `https://nominatim.openstreetmap.org/search?${q}`, 8000)
        const j = r.ok ? await r.json() : []
        const lat = coord(j[0]?.lat)
        const lng = coord(j[0]?.lon)
        if (lat && lng) return { ...endereco, lat, lng }
      } catch {
        /* tenta sem a rua */
      }
    }
  }

  throw new Error('Não foi possível localizar o CEP agora')
}
