import { CAMINHO_BRILHO } from '@/components/icones'

import { menosMovimento } from './aparelho'

const CORES = ['#EC7FA9', '#7A8FB0', '#EFA03A', '#A6C455'] // cores do logo

/** Estrelinhas coloridas saindo de um elemento (ao abrir uma loja). Efeito passageiro, fora da árvore do React. */
export function soltarBrilhos(el: Element | null) {
  if (!el || menosMovimento()) return
  const r = el.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const caixa = document.createElement('div')
  caixa.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5
    const d = 26 + Math.random() * 18
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('class', 'fx-burst')
    svg.style.cssText = `left:${x}px;top:${y}px;color:${CORES[i % 4]};--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;--s:${(7 + Math.random() * 6).toFixed(1)}px`
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('fill', 'currentColor')
    path.setAttribute('d', CAMINHO_BRILHO)
    svg.appendChild(path)
    caixa.appendChild(svg)
  }
  document.body.appendChild(caixa)
  setTimeout(() => caixa.remove(), 900)
}
