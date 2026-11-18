/** Mapa das lojas (Leaflet + OpenStreetMap), carregado à parte.
 *  - Visão geral (sem ponto de partida): todas as lojas; as que ficam coladas na tela viram uma bolinha com o
 *    número, que aproxima ao tocar. Tocando numa loja, ela é escolhida (os detalhes aparecem abaixo do mapa).
 *  - Com ponto de partida (CEP, endereço ou localização): "Você" e as lojas da lista, numeradas por distância.
 *  Celular: um dedo rola a página, dois dedos mexem no mapa. Computador: Ctrl + rolagem aproxima. */
import 'leaflet/dist/leaflet.css'

import clsx from 'clsx'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'

import { LOJAS, type Loja } from '@/data/lojas'
import { regiaoDe } from '@/data/regioes'
import { menosMovimento, telaDeToque } from '@/lib/aparelho'
import type { Ponto } from '@/lib/distancia'
import { bairroCidade } from '@/lib/loja'
import type { Foco, MarcadorLoja } from '@/lib/mapa'

interface Props {
  /** null = visão geral */
  origem: Ponto | null
  /** com ponto de partida: as lojas da lista, numeradas */
  lojas: MarcadorLoja[]
  selecionada: number | null
  aoSelecionar: (id: number) => void
  /** a loja mais perto fica longe (outra região): enquadra só você e ela */
  longe: boolean
  foco: Foco
}

// folga nas bordas: em cima cabe o pino inteiro (ele sobe ~40 px a partir do ponto); embaixo à direita, o zoom
const FOLGA: L.FitBoundsOptions = { paddingTopLeft: [30, 58], paddingBottomRight: [62, 30] }
const RAIO_GRUPO = 44 // px: lojas mais perto que isso na tela viram uma bolinha com o número
const limites = (lojas: Loja[]) => L.latLngBounds(lojas.map((l) => [l.lat, l.lng] as [number, number]))
const TODAS = limites(LOJAS)

const iconeNumerado = (m: MarcadorLoja, ativo: boolean, atrasoMs: number) =>
  L.divIcon({
    className: 'mk-wrap',
    html: `<span class="mk mk-${m.loja.uf.toLowerCase()}${ativo ? ' on' : ''}" style="--d:${atrasoMs}ms"><b>${m.numero}</b></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 41],
  })

const iconePino = (l: Loja, ativo: boolean) =>
  L.divIcon({
    className: 'mk-wrap',
    html: `<span class="mk mk-p mk-${l.uf.toLowerCase()}${ativo ? ' on' : ''}"><i></i></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 34],
  })

const iconeGrupo = (n: number) => {
  const s = n >= 10 ? 50 : n >= 4 ? 44 : 38
  return L.divIcon({
    className: 'gp-wrap',
    html: `<span class="gp" style="width:${s}px;height:${s}px"><b>${n}</b></span>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
  })
}

const iconeVoce = L.divIcon({
  className: 'eu-wrap',
  html: '<span class="eu"><i></i><em>Você</em></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

/** Junta as lojas que ficam a menos de RAIO_GRUPO px uma da outra no zoom atual. */
function agrupar(m: L.Map, lojas: Loja[]) {
  const z = m.getZoom()
  const grupos: { lojas: Loja[]; x: number; y: number }[] = []
  for (const l of lojas) {
    const p = m.project([l.lat, l.lng], z)
    const g = grupos.find((g) => Math.hypot(g.x - p.x, g.y - p.y) < RAIO_GRUPO)
    if (!g) grupos.push({ lojas: [l], x: p.x, y: p.y })
    else {
      g.lojas.push(l)
      g.x += (p.x - g.x) / g.lojas.length
      g.y += (p.y - g.y) / g.lojas.length
    }
  }
  return grupos.map((g) => ({ lojas: g.lojas, centro: m.unproject([g.x, g.y], z) }))
}

export default function MapaLojas({ origem, lojas, selecionada, aoSelecionar, longe, foco }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const camada = useRef<L.LayerGroup | null>(null)
  const voce = useRef<L.Marker | null>(null)
  const marcas = useRef(new Map<number, L.Marker>())
  const ultimaOrigem = useRef<Ponto | null>(null)
  const origemAgora = useRef(origem)
  const selecionar = useRef(aoSelecionar)
  const selecionadaAgora = useRef(selecionada)
  const desenharVisao = useRef<() => void>(() => {})
  const [dica, setDica] = useState<string | null>(null)

  useEffect(() => {
    selecionar.current = aoSelecionar
  }, [aoSelecionar])

  // cria o mapa uma vez
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const toque = telaDeToque()
    const m = L.map(el, { scrollWheelZoom: false, dragging: !toque, zoomControl: false, zoomSnap: 0.5 })
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar' }).addTo(m)
    m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>')
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(m)
    m.fitBounds(TODAS, { ...FOLGA, animate: false })
    camada.current = L.layerGroup().addTo(m)
    mapa.current = m

    // visão geral: lojas soltas ou agrupadas, conforme o zoom
    desenharVisao.current = () => {
      const c = camada.current
      if (!c || origemAgora.current) return
      c.clearLayers()
      marcas.current.clear()
      for (const g of agrupar(m, LOJAS)) {
        if (g.lojas.length === 1) {
          const l = g.lojas[0]
          const mk = L.marker([l.lat, l.lng], {
            icon: iconePino(l, l.id === selecionadaAgora.current),
            title: `${l.nome} — ${bairroCidade(l)}`,
            riseOnHover: true,
          }).addTo(c)
          mk.on('click', () => selecionar.current(l.id))
          marcas.current.set(l.id, mk)
        } else {
          const mk = L.marker(g.centro, {
            icon: iconeGrupo(g.lojas.length),
            title: `${g.lojas.length} lojas aqui — toque para aproximar`,
          }).addTo(c)
          mk.on('click', () => {
            const b = limites(g.lojas)
            const z = m.getBoundsZoom(b, false, L.point(110, 110))
            if (z <= m.getZoom() + 0.25) m.setView(b.getCenter(), m.getZoom() + 2, { animate: !menosMovimento() })
            else m.fitBounds(b, { ...FOLGA, maxZoom: 16, animate: !menosMovimento() })
          })
        }
      }
    }
    m.on('zoomend', () => desenharVisao.current())

    // dicas de uso (como no Google Maps): um dedo rola a página; Ctrl + rolagem aproxima
    let espera = 0
    const mostrarDica = (texto: string) => {
      setDica(texto)
      window.clearTimeout(espera)
      espera = window.setTimeout(() => setDica(null), 1300)
    }
    const mover = (e: TouchEvent) => e.touches.length === 1 && mostrarDica('Use dois dedos para mover o mapa')
    const comecar = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        setDica(null)
        m.dragging.enable()
      }
    }
    const terminar = (e: TouchEvent) => {
      if (!e.touches.length) m.dragging.disable()
    }
    const rolar = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return mostrarDica('Use Ctrl + rolagem para aproximar o mapa')
      e.preventDefault()
      m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() + (e.deltaY < 0 ? 1 : -1))
    }
    if (toque) {
      el.addEventListener('touchmove', mover, { passive: true })
      el.addEventListener('touchstart', comecar, { passive: true })
      el.addEventListener('touchend', terminar, { passive: true })
    } else el.addEventListener('wheel', rolar, { passive: false })

    const marcasAtuais = marcas.current
    return () => {
      window.clearTimeout(espera)
      el.removeEventListener('touchmove', mover)
      el.removeEventListener('touchstart', comecar)
      el.removeEventListener('touchend', terminar)
      el.removeEventListener('wheel', rolar)
      m.remove()
      mapa.current = null
      camada.current = null
      voce.current = null
      ultimaOrigem.current = null
      marcasAtuais.clear()
    }
  }, [])

  // modo: visão geral (todas as lojas) ou lojas perto de um ponto
  useEffect(() => {
    const m = mapa.current
    const c = camada.current
    if (!m || !c) return
    m.invalidateSize()
    origemAgora.current = origem
    if (!origem) {
      voce.current?.remove()
      voce.current = null
      ultimaOrigem.current = null
      desenharVisao.current()
      return
    }
    const novoLugar = ultimaOrigem.current !== origem
    ultimaOrigem.current = origem
    if (voce.current) voce.current.setLatLng(origem)
    else
      voce.current = L.marker(origem, {
        icon: iconeVoce,
        keyboard: false,
        interactive: false,
        zIndexOffset: -1000,
      }).addTo(m)
    if (novoLugar) {
      c.clearLayers()
      marcas.current.clear()
    }
    // "mostrar menos": tira os pinos das lojas que saíram da lista
    const naLista = new Set(lojas.map((x) => x.loja.id))
    marcas.current.forEach((mk, id) => {
      if (naLista.has(id)) return
      c.removeLayer(mk)
      marcas.current.delete(id)
    })
    let novos = 0
    lojas.forEach((ml) => {
      if (marcas.current.has(ml.loja.id)) return
      const mk = L.marker([ml.loja.lat, ml.loja.lng], {
        icon: iconeNumerado(ml, ml.loja.id === selecionadaAgora.current, novos++ * 70),
        keyboard: false, // a lista abaixo do mapa tem as mesmas lojas, na mesma ordem
        title: `${ml.numero}. ${ml.loja.nome}`,
        riseOnHover: true,
      }).addTo(c)
      mk.on('click', () => selecionar.current(ml.loja.id))
      marcas.current.set(ml.loja.id, mk)
    })
    // ao trocar de lugar ou recolher: a mais perto e as que também ficam perto (até 3); com "ver mais": todas
    const raio = Math.max(8, (lojas[0]?.distancia ?? 0) * 2.5)
    const alvo = longe
      ? lojas.slice(0, 1)
      : novos > 0 && !novoLugar
        ? lojas
        : lojas.slice(0, 3).filter((x, i) => i === 0 || x.distancia <= raio)
    const pontos = L.latLngBounds([
      [origem.lat, origem.lng],
      ...alvo.map((x) => [x.loja.lat, x.loja.lng] as [number, number]),
    ])
    m.fitBounds(pontos, { ...FOLGA, maxZoom: 15, animate: !menosMovimento() })
  }, [origem, lojas, longe])

  // visão geral: para onde olhar (todas as lojas, uma região ou uma loja)
  useEffect(() => {
    const m = mapa.current
    if (!m || origem) return
    const animate = !menosMovimento()
    if (foco.tipo === 'tudo') m.fitBounds(TODAS, { ...FOLGA, animate })
    else if (foco.tipo === 'regiao')
      m.fitBounds(limites(LOJAS.filter((l) => regiaoDe(l) === foco.id)), { ...FOLGA, maxZoom: 14, animate })
    else {
      const l = LOJAS.find((x) => x.id === foco.id)
      if (l) m.setView([l.lat, l.lng], Math.max(m.getZoom(), 15), { animate })
    }
  }, [foco, origem])

  // loja escolhida: destaca o pino; com ponto de partida, mostra a loja se ela estiver fora da vista
  useEffect(() => {
    selecionadaAgora.current = selecionada
    marcas.current.forEach((mk, id) => {
      const ativo = id === selecionada
      mk.getElement()?.querySelector('.mk')?.classList.toggle('on', ativo)
      mk.setZIndexOffset(ativo ? 1000 : 0)
    })
    const m = mapa.current
    const mk = selecionada != null ? marcas.current.get(selecionada) : undefined
    if (!m || !mk || !origem) return
    const ll = mk.getLatLng()
    if (!m.getBounds().pad(-0.15).contains(ll)) {
      m.fitBounds(L.latLngBounds([[origem.lat, origem.lng], ll]), { ...FOLGA, maxZoom: 15, animate: !menosMovimento() })
    }
  }, [selecionada, origem])

  return (
    <div className="relative">
      <div
        ref={caixa}
        className="mapa h-[clamp(250px,min(76vw,58vh),360px)] w-full bg-[#F1ECE6]"
        role="region"
        aria-label="Mapa das lojas Lalelilo. Use a busca acima para encontrar a loja mais perto."
      />
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0 z-[800] grid place-items-center bg-ink/60 p-6 text-center text-[15px] font-extrabold text-white transition-opacity duration-300',
          dica ? 'opacity-100' : 'opacity-0',
        )}
      >
        {dica}
      </div>
    </div>
  )
}
