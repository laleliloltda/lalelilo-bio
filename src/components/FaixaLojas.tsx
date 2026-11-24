/** "Tem Lalelilo pertinho de você": as lojas passando em duas faixas, uma para cada lado (como a vitrine "Tudo na
 *  intranet" do hall). Tocou numa loja, ela abre no localizador com o WhatsApp e o Grupo VIP. Mouse em cima ou foco
 *  do teclado pausa; com "reduzir movimento", as faixas param e rolam com o dedo. */
import clsx from 'clsx'
import type { CSSProperties } from 'react'

import { LOJAS, type Loja } from '@/data/lojas'

import { Brilho } from './icones'

const ORDEM = [...LOJAS].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
const LINHAS = [ORDEM.filter((_, i) => i % 2 === 0), ORDEM.filter((_, i) => i % 2 === 1)]

export function FaixaLojas({ aoEscolher }: { aoEscolher: (loja: Loja) => void }) {
  return (
    <section className="faixa-lojas reveal [animation-delay:.2s]" aria-labelledby="t-faixa">
      <h2 id="t-faixa" className="faixa-lojas-titulo">
        <Brilho className="size-3 text-white" />
        Tem Lalelilo pertinho de você
        <Brilho className="size-3 text-white" />
      </h2>
      {LINHAS.map((itens, k) => (
        <div
          key={k}
          className={clsx('faixa-lojas-linha', k === 1 && 'is-reverso')}
          style={{ '--dur': `${Math.round(itens.length * 3.6)}s` } as CSSProperties}
        >
          <ul className="faixa-lojas-trilho">
            {[0, 1].map((copia) =>
              itens.map((l) => (
                <li
                  key={`${copia}-${l.id}`}
                  className={clsx(copia === 1 && 'is-copia')}
                  aria-hidden={copia === 1 || undefined}
                >
                  <button
                    type="button"
                    tabIndex={copia === 1 ? -1 : undefined}
                    className={`faixa-loja is-${l.uf.toLowerCase()}`}
                    onClick={() => aoEscolher(l)}
                    aria-label={`${l.nome}: ver o WhatsApp e o Grupo VIP`}
                  >
                    <i aria-hidden="true" />
                    {l.nome}
                  </button>
                </li>
              )),
            )}
          </ul>
        </div>
      ))}
      <p className="faixa-lojas-dica">Toque na sua loja para ver o WhatsApp e o Grupo VIP</p>
    </section>
  )
}
