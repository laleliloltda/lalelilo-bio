/** Mapa das lojas mais perto (Leaflet + OpenStreetMap). Carregado só quando alguém busca (arquivo à parte).
 *  É um apoio visual: a lista logo abaixo tem as mesmas lojas e é ela que se usa pelo teclado/leitor de tela. */
import 'leaflet/dist/leaflet.css'

import clsx from 'clsx'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'

import type { Loja } from '@/data/lojas'
import { menosMovimento, telaDeToque } from '@/lib/aparelho'
import type { Ponto } from '@/lib/distancia'

export interface MarcadorLoja {
  loja: Loja
  numero: number
  distancia: number
}

interface Props {
  origem: Ponto
  lojas: MarcadorLoja[]
  selecionada: number | null
  aoSelecionar: (id: number) => void
  /** a loja mais perto fica longe (outra região): enquadra só você e ela */
  longe: boolean
}

const iconeLoja = (m: MarcadorLoja, ativo: boolean, atrasoMs: number) =>
  L.divIcon({
    className: 'mk-wrap',
    html: `<span class="mk mk-${m.loja.uf.toLowerCase()}${ativo ? ' on' : ''}" style="--d:${atrasoMs}ms"><b>${m.numero}</b></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 41],
  })

// folga nas bordas: em cima cabe o pino inteiro (ele sobe 41 px a partir do ponto); embaixo à direita, o zoom
const FOLGA: L.FitBoundsOptions = { paddingTopLeft: [30, 58], paddingBottomRight: [62, 30] }

const iconeVoce = L.divIcon({
  className: 'eu-wrap',
  html: '<span class="eu"><i></i><em>Você</em></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

export default function MapaLojas({ origem, lojas, selecionada, aoSelecionar, longe }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const mapa = useRef<L.Map | null>(null)
  const camada = useRef<L.LayerGroup | null>(null)
  const voce = useRef<L.Marker | null>(null)
  const marcas = useRef(new Map<number, L.Marker>())
  const ultimaOrigem = useRef<Ponto | null>(null)
  const selecionar = useRef(aoSelecionar)
  const selecionadaAgora = useRef(selecionada)
  const [dica, setDica] = useState(false)

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
    camada.current = L.layerGroup().addTo(m)
    mapa.current = m

    // celular: um dedo rola a página; dois dedos mexem no mapa (como no Google Maps)
    let espera = 0
    const mover = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      setDica(true)
      window.clearTimeout(espera)
      espera = window.setTimeout(() => setDica(false), 1300)
    }
    const comecar = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        setDica(false)
        m.dragging.enable()
      }
    }
    const terminar = (e: TouchEvent) => {
      if (!e.touches.length) m.dragging.disable()
    }
    if (toque) {
      el.addEventListener('touchmove', mover, { passive: true })
      el.addEventListener('touchstart', comecar, { passive: true })
      el.addEventListener('touchend', terminar, { passive: true })
    }
    const marcasAtuais = marcas.current
    return () => {
      window.clearTimeout(espera)
      el.removeEventListener('touchmove', mover)
      el.removeEventListener('touchstart', comecar)
      el.removeEventListener('touchend', terminar)
      m.remove()
      mapa.current = null
      camada.current = null
      voce.current = null
      ultimaOrigem.current = null
      marcasAtuais.clear()
    }
  }, [])

  // você + lojas; ao trocar de lugar, enquadra você e as 3 mais perto; ao pedir mais lojas, enquadra todas
  useEffect(() => {
    const m = mapa.current
    const c = camada.current
    if (!m || !c) return
    m.invalidateSize()
    const novoLugar = ultimaOrigem.current !== origem
    ultimaOrigem.current = origem
    if (voce.current) voce.current.setLatLng(origem)
    else
      voce.current = L.marker(origem, {
        icon: iconeVoce,
        keyboard: false,
        interactive: false,
        zIndexOffset: -1000,
      }).addTo(m) // pinos por cima do "Você"

    if (novoLugar) {
      c.clearLayers()
      marcas.current.clear()
    }
    let novos = 0
    lojas.forEach((ml) => {
      if (marcas.current.has(ml.loja.id)) return
      const mk = L.marker([ml.loja.lat, ml.loja.lng], {
        icon: iconeLoja(ml, ml.loja.id === selecionadaAgora.current, novos++ * 70),
        keyboard: false,
        title: `${ml.numero}. ${ml.loja.nome}`,
        riseOnHover: true,
      }).addTo(c)
      mk.on('click', () => selecionar.current(ml.loja.id))
      marcas.current.set(ml.loja.id, mk)
    })

    // ao trocar de lugar: a mais perto e as que também ficam perto (até 3); com "ver mais": todas as mostradas
    const raio = Math.max(8, (lojas[0]?.distancia ?? 0) * 2.5)
    const alvo = longe
      ? lojas.slice(0, 1)
      : novoLugar
        ? lojas.slice(0, 3).filter((x, i) => i === 0 || x.distancia <= raio)
        : lojas
    const pontos = L.latLngBounds([
      [origem.lat, origem.lng],
      ...alvo.map((x) => [x.loja.lat, x.loja.lng] as [number, number]),
    ])
    m.fitBounds(pontos, { ...FOLGA, maxZoom: 15, animate: !menosMovimento() })
  }, [origem, lojas, longe])

  // loja escolhida (na lista ou no mapa): destaca o marcador e mostra a loja se estiver fora da vista
  useEffect(() => {
    selecionadaAgora.current = selecionada
    marcas.current.forEach((mk, id) => {
      const ativo = id === selecionada
      mk.getElement()?.querySelector('.mk')?.classList.toggle('on', ativo)
      mk.setZIndexOffset(ativo ? 1000 : 0)
    })
    const m = mapa.current
    const mk = selecionada != null ? marcas.current.get(selecionada) : undefined
    if (!m || !mk) return
    const ll = mk.getLatLng()
    if (!m.getBounds().pad(-0.15).contains(ll)) {
      m.fitBounds(L.latLngBounds([[origem.lat, origem.lng], ll]), { ...FOLGA, maxZoom: 15, animate: !menosMovimento() })
    }
  }, [selecionada, origem])

  return (
    <div className="relative">
      <div
        ref={caixa}
        className="mapa h-[clamp(220px,min(64vw,52vh),310px)] w-full bg-[#F1ECE6]"
        role="region"
        aria-label="Mapa com a sua localização e as lojas mais perto. A lista logo abaixo tem as mesmas lojas."
      />
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0 z-[800] grid place-items-center bg-ink/60 p-6 text-center text-[15px] font-extrabold text-white transition-opacity duration-300',
          dica ? 'opacity-100' : 'opacity-0',
        )}
      >
        Use dois dedos para mover o mapa
      </div>
    </div>
  )
}
