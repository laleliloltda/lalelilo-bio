import { describe, expect, it } from 'vitest'

import { LOJAS } from '@/data/lojas'

import { centroDe, ehCep, geocodificar, LugarNaoEncontrado, pareceCep, sugestoes } from './busca'
import { CepNaoEncontrado, localizarCep } from './cep'
import { distanciaFalada, formatarDistancia, km, ordenarPorDistancia } from './distancia'
import { bairroCidade, cidadeDe, rotaGoogleMaps } from './loja'
import { mascaraCep, norm } from './texto'

const resposta = (status: number, corpo: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => corpo }) as Response

/** fetch falso: devolve, para cada serviço, o que o teste mandar (ou 500). */
function servicos(mapa: Record<string, () => Response>) {
  const chamadas: string[] = []
  const buscar = (async (url: string) => {
    chamadas.push(url)
    const chave = Object.keys(mapa).find((k) => url.includes(k))
    return chave ? mapa[chave]() : resposta(500, {})
  }) as unknown as typeof fetch
  return { buscar, chamadas }
}

describe('texto', () => {
  it('máscara do CEP enquanto digita', () => {
    expect(mascaraCep('51110')).toBe('51110')
    expect(mascaraCep('511101')).toBe('51110-1')
    expect(mascaraCep('51110160999')).toBe('51110-160')
    expect(mascaraCep('51.110-160')).toBe('51110-160')
  })
  it('busca sem acento', () => {
    expect(norm('São Lourenço da Mata')).toBe('sao lourenco da mata')
  })
})

describe('distância', () => {
  it('Recife (RioMar) → Shopping Boa Vista ≈ 3 km', () => {
    const d = km({ lat: -8.08598, lng: -34.89414 }, { lat: -8.06007, lng: -34.88798 })
    expect(d).toBeGreaterThan(2.7)
    expect(d).toBeLessThan(3.2)
  })
  it('formata como se fala', () => {
    expect(formatarDistancia(0.43)).toBe('450 m')
    expect(formatarDistancia(0.01)).toBe('50 m')
    expect(formatarDistancia(2.34)).toBe('2,3 km')
    expect(formatarDistancia(23.4)).toBe('23 km')
    expect(formatarDistancia(2130.2)).toBe('2.130 km')
    expect(distanciaFalada(0.43)).toBe('450 metros')
    expect(distanciaFalada(2.34)).toBe('2,3 quilômetros')
  })
  it('do CEP do RioMar, a loja mais perto é a do RioMar', () => {
    const [primeira] = ordenarPorDistancia({ lat: -8.0866848, lng: -34.8910061 }, LOJAS)
    expect(primeira.item.nome).toBe('Shopping RioMar Recife')
  })
})

describe('lojas', () => {
  it('todas têm coordenada no Nordeste e endereço com cidade', () => {
    expect(LOJAS).toHaveLength(38)
    for (const l of LOJAS) {
      expect(l.lat).toBeGreaterThan(-10.5)
      expect(l.lat).toBeLessThan(-6.5)
      expect(l.lng).toBeGreaterThan(-39)
      expect(l.lng).toBeLessThan(-34.7)
      expect(bairroCidade(l).length).toBeGreaterThan(2)
    }
  })
  it('"Como chegar" leva o nome do shopping junto', () => {
    const tacaruna = LOJAS.find((l) => l.nome === 'Shopping Tacaruna')!
    expect(decodeURIComponent(rotaGoogleMaps(tacaruna))).toContain('destination=Shopping Tacaruna, Av. Gov. Agamenon')
    const partage = LOJAS.find((l) => l.nome.startsWith('Shopping Partage'))!
    expect(decodeURIComponent(rotaGoogleMaps(partage))).toContain('destination=Shopping Partage, Av.')
  })
})

describe('localizarCep', () => {
  it('usa a coordenada do AwesomeAPI quando ele tem', async () => {
    const { buscar, chamadas } = servicos({
      awesomeapi: () =>
        resposta(200, { lat: '-8.0866848', lng: '-34.8910061', district: 'Pina', city: 'Recife', state: 'PE' }),
    })
    const lugar = await localizarCep('51110160', buscar)
    expect(lugar).toMatchObject({ lat: -8.0866848, lng: -34.8910061, bairro: 'Pina', cidade: 'Recife' })
    expect(chamadas).toHaveLength(1)
  })

  it('sem coordenada: ViaCEP dá o endereço e o OpenStreetMap acha a rua', async () => {
    const { buscar, chamadas } = servicos({
      awesomeapi: () => resposta(404, { code: 'not_found' }),
      viacep: () => resposta(200, { logradouro: 'Rua São Miguel', bairro: 'Afogados', localidade: 'Recife', uf: 'PE' }),
      nominatim: () => resposta(200, [{ lat: '-8.0802793', lon: '-34.9080407' }]),
    })
    const lugar = await localizarCep('50850270', buscar)
    expect(lugar).toMatchObject({ lat: -8.0802793, lng: -34.9080407, bairro: 'Afogados' })
    expect(chamadas.at(-1)).toContain('street=Rua+S%C3%A3o+Miguel')
    expect(chamadas.at(-1)).toContain('state=Pernambuco')
  })

  it('CEP que não existe: avisa (não inventa um lugar)', async () => {
    const { buscar } = servicos({
      awesomeapi: () => resposta(404, { code: 'not_found' }),
      viacep: () => resposta(200, { erro: 'true' }),
      brasilapi: () =>
        resposta(200, { city: 'Sarandi', location: { coordinates: { latitude: '-23', longitude: '-51' } } }),
    })
    await expect(localizarCep('99999999', buscar)).rejects.toBeInstanceOf(CepNaoEncontrado)
  })

  it('AwesomeAPI e ViaCEP fora do ar: tenta o BrasilAPI', async () => {
    const { buscar } = servicos({
      brasilapi: () =>
        resposta(200, {
          city: 'Recife',
          state: 'PE',
          location: { coordinates: { latitude: '-8.05389', longitude: '-34.88111' } },
        }),
    })
    const lugar = await localizarCep('51110160', buscar)
    expect(lugar).toMatchObject({ lat: -8.05389, lng: -34.88111, cidade: 'Recife' })
  })

  it('tudo fora do ar: erro genérico (não "CEP não encontrado")', async () => {
    const { buscar } = servicos({})
    const erro = await localizarCep('51110160', buscar).catch((e) => e)
    expect(erro).toBeInstanceOf(Error)
    expect(erro).not.toBeInstanceOf(CepNaoEncontrado)
  })
})

describe('endereço das lojas', () => {
  it('cidade sai do endereço', () => {
    const ipojuca = LOJAS.find((l) => l.nome === 'Ipojuca')!
    const partage = LOJAS.find((l) => l.nome.startsWith('Shopping Partage'))!
    expect(cidadeDe(ipojuca)).toBe('Ipojuca')
    expect(cidadeDe(partage)).toBe('Campina Grande')
  })
})

describe('busca do localizador', () => {
  it('reconhece CEP', () => {
    expect(ehCep('51110-160')).toBe(true)
    expect(ehCep('51110160')).toBe(true)
    expect(ehCep('51.110-160')).toBe(true)
    expect(ehCep('5111016')).toBe(false)
    expect(ehCep('boa viagem')).toBe(false)
    expect(pareceCep('5111')).toBe(true)
    expect(pareceCep('boa')).toBe(false)
  })

  it('sugere cidade, bairro e loja pelo começo do nome', () => {
    const caru = sugestoes('caru')
    expect(caru[0]).toMatchObject({ tipo: 'lugar', titulo: 'Caruaru' })
    expect(caru.map((s) => s.titulo)).toEqual(expect.arrayContaining(['Centro de Caruaru', 'Shopping Caruaru']))
    expect(caru.at(-1)).toMatchObject({ tipo: 'buscar', texto: 'caru' })
    const boaVista = sugestoes('boa vi').map((s) => `${s.tipo}:${s.titulo}`)
    expect(boaVista).toEqual(expect.arrayContaining(['lugar:Boa Vista', 'loja:Shopping Boa Vista']))
    expect(sugestoes('rio').map((s) => s.titulo)).toContain('Shopping RioMar Recife')
    expect(sugestoes('51110')).toEqual([])
  })

  it('ponto médio das lojas de uma cidade', () => {
    const c = centroDe(LOJAS.filter((l) => cidadeDe(l) === 'Caruaru'))
    expect(c.lat).toBeCloseTo(-8.2927, 2)
    expect(c.lng).toBeCloseTo(-35.963, 2)
  })

  it('endereço: tenta na região das lojas e depois no Brasil todo', async () => {
    const chamadas: string[] = []
    const buscar = (async (url: string) => {
      chamadas.push(url)
      return resposta(
        200,
        chamadas.length === 1
          ? []
          : [{ lat: '-8.1283', lon: '-34.9033', address: { suburb: 'Boa Viagem', city: 'Recife' } }],
      )
    }) as unknown as typeof fetch
    const lugar = await geocodificar('boa viagem', buscar)
    expect(lugar).toMatchObject({ lat: -8.1283, lng: -34.9033, rotulo: 'Boa Viagem, Recife' })
    expect(chamadas[0]).toContain('bounded=1')
    expect(chamadas[1]).not.toContain('bounded=1')
  })

  it('endereço que não existe: avisa', async () => {
    const buscar = (async () => resposta(200, [])) as unknown as typeof fetch
    await expect(geocodificar('lugar que não existe', buscar)).rejects.toBeInstanceOf(LugarNaoEncontrado)
  })
})
