/** Logo redondo da abertura: anel nas 4 cores da marca girando devagar e as 4 estrelinhas da Lalelilo numa órbita
 *  inclinada — passam por trás do logo e voltam pela frente (a mesma ideia da órbita do hall da intranet). A órbita
 *  pausa fora da tela e com a aba escondida; com "reduzir movimento", as estrelas ficam paradas. */
import { type CSSProperties, useEffect, useRef } from 'react'

import { menosMovimentoAgora } from '@/lib/movimento'

import { Brilho } from './icones'

const ESTRELAS = [
  { cor: '#FF7BAC', tam: 22, fase: 0.4 },
  { cor: '#718FB1', tam: 16, fase: 0.4 + Math.PI / 2 },
  { cor: '#F89D13', tam: 19, fase: 0.4 + Math.PI },
  { cor: '#A1C63D', tam: 15, fase: 0.4 + (3 * Math.PI) / 2 },
]
const RX = 122 // raio da órbita na horizontal (px)
const RY = 40 // na vertical: órbita "deitada"
const INCLINACAO = (-12 * Math.PI) / 180
const SEN = Math.sin(INCLINACAO)
const COS = Math.cos(INCLINACAO)
const VOLTA = 16000 // ms por volta
const GRAUS = (INCLINACAO * 180) / Math.PI

/** metade da trilha: a de trás (passa atrás do logo) ou a da frente (por cima dele) */
const arco = (frente: boolean) => `M ${-RX} 0 A ${RX} ${RY} 0 0 ${frente ? 0 : 1} ${RX} 0`

function Trilha({ frente }: { frente: boolean }) {
  return (
    <svg className={frente ? 'orbita-trilha is-frente' : 'orbita-trilha'} viewBox="-134 -72 268 144" aria-hidden="true">
      <path d={arco(frente)} transform={`rotate(${GRAUS})`} />
    </svg>
  )
}

export function OrbitaLogo() {
  const caixa = useRef<HTMLDivElement>(null)
  const estrelas = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const posicionar = (t: number) => {
      ESTRELAS.forEach((s, i) => {
        const no = estrelas.current[i]
        if (!no) return
        const a = s.fase + (t / VOLTA) * Math.PI * 2
        const x0 = RX * Math.cos(a)
        const y0 = RY * Math.sin(a)
        const x = x0 * COS - y0 * SEN
        const y = x0 * SEN + y0 * COS
        const frente = Math.sin(a) // > 0: passando na frente do logo
        const p = (frente + 1) / 2
        no.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.66 + 0.34 * p).toFixed(3)})`
        no.style.opacity = (0.45 + 0.55 * p).toFixed(2)
        no.style.zIndex = frente > 0 ? '3' : '1'
      })
    }
    posicionar(0)
    if (menosMovimentoAgora()) return
    let t = 0
    let ultimo = 0
    let raf = 0
    let naTela = true
    const quadro = (agora: number) => {
      if (ultimo) t += Math.min(48, agora - ultimo)
      ultimo = agora
      posicionar(t)
      raf = requestAnimationFrame(quadro)
    }
    const ligar = () => {
      if (raf || !naTela || document.hidden) return
      ultimo = 0
      raf = requestAnimationFrame(quadro)
    }
    const desligar = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const obs =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([e]) => {
            naTela = e.isIntersecting
            if (naTela) ligar()
            else desligar()
          })
    obs?.observe(el)
    const aba = () => (document.hidden ? desligar() : ligar())
    document.addEventListener('visibilitychange', aba)
    ligar()
    return () => {
      desligar()
      obs?.disconnect()
      document.removeEventListener('visibilitychange', aba)
    }
  }, [])

  return (
    <div ref={caixa} className="orbita-logo reveal">
      <Trilha frente={false} />
      {ESTRELAS.map((s, i) => (
        <span
          key={s.cor}
          ref={(no) => {
            estrelas.current[i] = no
          }}
          className="orbita-estrela"
          style={{ '--tam': `${s.tam}px`, color: s.cor } as CSSProperties}
          aria-hidden="true"
        >
          <Brilho className="block size-full" />
        </span>
      ))}
      <span className="orbita-halo" aria-hidden="true" />
      <span className="orbita-anel" aria-hidden="true" />
      <span className="orbita-disco">
        <img src="/logo-lalelilo.jpg" alt="Lalelilo Kids" height={116} />
      </span>
      <Trilha frente />
    </div>
  )
}
