/** A linha viva da abertura (como a do hall da intranet): uma pílula de vidro que reveza frases — as lojas, com o
 *  número rolando, o canal novo, as vagas e o Grupo VIP. As frases com seta levam à seção. Mouse ou foco em cima
 *  pausa; com "reduzir movimento", fica só a primeira. */
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { LOJAS } from '@/data/lojas'
import { VAGAS } from '@/data/vagas'
import { useApareceu, useReduzirMovimento } from '@/lib/movimento'

import { Brilho } from './icones'
import { Odometro } from './Odometro'

const TEMPO = 4200 // ms em cada frase (a primeira fica um pouco mais)

export function LinhaViva() {
  const reduzir = useReduzirMovimento()
  const [ref, visto] = useApareceu<HTMLParagraphElement>('0px')
  const [i, setI] = useState(0)
  const [parado, setParado] = useState(false)
  const frases: { chave: string; href?: string; conteudo: ReactNode }[] = [
    {
      chave: 'lojas',
      conteudo: (
        <>
          <span>
            <b className="font-extrabold">
              <Odometro texto={String(LOJAS.length)} ativo={visto && i === 0} />
            </b>{' '}
            lojas
          </span>
          <Brilho className="size-[9px] shrink-0 text-pink-d" />
          <span>Pernambuco · Paraíba · Alagoas</span>
        </>
      ),
    },
    {
      chave: 'canal',
      href: '#canal',
      conteudo: (
        <span>
          Novo canal no YouTube: <b className="font-extrabold">Aventuras Bíblicas</b>
        </span>
      ),
    },
    {
      chave: 'vagas',
      href: '#vagas',
      conteudo: (
        <span>
          <b className="font-extrabold">{VAGAS.length} vagas abertas</b> · trabalhe com a gente
        </span>
      ),
    },
    {
      chave: 'vip',
      href: '#lojas',
      conteudo: (
        <span>
          <b className="font-extrabold">Grupo VIP</b> · novidades em primeira mão
        </span>
      ),
    },
  ]
  const n = frases.length

  useEffect(() => {
    if (reduzir || parado || !visto) return
    const t = window.setTimeout(() => setI((x) => (x + 1) % n), i === 0 ? TEMPO * 1.5 : TEMPO)
    return () => window.clearTimeout(t)
  }, [i, n, reduzir, parado, visto])

  const anterior = (i - 1 + n) % n
  return (
    <p
      ref={ref}
      className="linha-viva reveal [animation-delay:.1s]"
      onMouseEnter={() => setParado(true)}
      onMouseLeave={() => setParado(false)}
      onFocus={() => setParado(true)}
      onBlur={() => setParado(false)}
    >
      {frases.map((f, k) => {
        const ativa = k === i
        const classe = clsx('linha-frase', ativa && 'is-ativa', !ativa && k === anterior && 'is-saindo')
        if (!f.href)
          return (
            <span key={f.chave} className={classe} aria-hidden={!ativa || undefined}>
              {f.conteudo}
            </span>
          )
        return (
          <a
            key={f.chave}
            href={f.href}
            className={classe}
            tabIndex={ativa ? undefined : -1}
            aria-hidden={!ativa || undefined}
          >
            {f.conteudo}
            <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
          </a>
        )
      })}
    </p>
  )
}
