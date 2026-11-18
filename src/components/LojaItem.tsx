import clsx from 'clsx'
import { ChevronDown, MapPin, Navigation } from 'lucide-react'
import { useEffect, useId, useRef, type CSSProperties, type ReactNode, type Ref } from 'react'

import type { Loja, UF } from '@/data/lojas'
import { soltarBrilhos } from '@/lib/brilho'
import { formatarDistancia } from '@/lib/distancia'
import { bairroCidade, rotaGoogleMaps } from '@/lib/loja'
import { norm } from '@/lib/texto'

import { Acao } from './Acao'

const COR_PINO: Record<UF, string> = { PE: 'bg-pink', AL: 'bg-orange', PB: 'bg-green' }
const COR_NUMERO: Record<UF, string> = { PE: 'bg-pe', AL: 'bg-al', PB: 'bg-pb' }

interface Props {
  loja: Loja
  aberta: boolean
  aoAlternar: () => void
  aoUsar: (loja: Loja) => void
  /** termo da busca (sem acento), destacado no nome */
  termo?: string
  /** lista "mais perto": posição, distância e etiqueta da primeira */
  numero?: number
  distancia?: number
  maisPerto?: boolean
  /** posição na animação de entrada */
  indice?: number
  cabecaRef?: Ref<HTMLButtonElement>
}

function realce(nome: string, termo?: string): ReactNode {
  if (!termo) return nome
  const i = norm(nome).indexOf(termo)
  if (i < 0) return nome
  return (
    <>
      {nome.slice(0, i)}
      <mark>{nome.slice(i, i + termo.length)}</mark>
      {nome.slice(i + termo.length)}
    </>
  )
}

/** Uma loja na lista: abre e mostra o endereço, "Como chegar", WhatsApp e Grupo VIP. */
export function LojaItem({
  loja,
  aberta,
  aoAlternar,
  aoUsar,
  termo,
  numero,
  distancia,
  maisPerto,
  indice,
  cabecaRef,
}: Props) {
  const idPainel = useId()
  const marca = useRef<HTMLSpanElement>(null)
  const estavaAberta = useRef(aberta)
  const perto = numero != null

  // estrelinhas quando a loja abre (pela lista ou pelo mapa)
  useEffect(() => {
    if (aberta && !estavaAberta.current) soltarBrilhos(marca.current)
    estavaAberta.current = aberta
  }, [aberta])

  return (
    <li
      className={clsx('store', aberta && 'open')}
      style={indice != null ? ({ '--i': indice } as CSSProperties) : undefined}
    >
      <button
        ref={cabecaRef}
        type="button"
        className="store-head flex min-h-[52px] w-full items-center gap-3 rounded-[18px] px-2.5 py-2 text-left max-[360px]:gap-2.5 max-[360px]:px-2"
        aria-expanded={aberta}
        aria-controls={idPainel}
        onClick={aoAlternar}
      >
        {perto ? (
          <span
            ref={marca}
            aria-hidden="true"
            className={clsx(
              'grid size-8 shrink-0 place-items-center rounded-[11px] text-[15px] font-black text-white shadow-[0_5px_12px_-7px_rgba(47,52,80,.8)]',
              COR_NUMERO[loja.uf],
            )}
          >
            {numero}
          </span>
        ) : (
          <span
            ref={marca}
            aria-hidden="true"
            className={clsx('grid size-8 shrink-0 place-items-center rounded-[10px] text-white', COR_PINO[loja.uf])}
          >
            <MapPin className="size-4" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={clsx('leading-tight', perto ? 'text-[15px] font-extrabold' : 'text-[15.5px] font-bold')}>
            {perto && <span className="sr-only">{numero}. </span>}
            {realce(loja.nome, termo)}
          </span>
          {perto && (
            // distância, "mais perto" e bairro/cidade numa linha só (quebra sozinha em tela estreita)
            <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] leading-snug font-semibold text-muted-2">
              {distancia != null && (
                <span className="pl-dist rounded-full border border-line bg-white px-2 py-px text-[12.5px] font-extrabold whitespace-nowrap text-ink tabular-nums">
                  <span className="sr-only">a </span>
                  {formatarDistancia(distancia)}
                </span>
              )}
              {maisPerto && (
                <span className="rounded-full bg-[#E3F5E9] px-[7px] py-px text-[10.5px] font-black tracking-[.04em] whitespace-nowrap text-[#14532D] uppercase">
                  Mais perto
                </span>
              )}
              <span>{bairroCidade(loja)}</span>
            </span>
          )}
        </span>
        <ChevronDown aria-hidden="true" className="chev size-[18px] shrink-0 text-[#B5B8C9]" />
      </button>
      <div className="actions" id={idPainel}>
        <div className="actions-in">
          <div className="grid gap-2 px-2.5 pt-0.5 pb-3">
            <Endereco loja={loja} />
            <Acao tipo="wa" loja={loja} aoUsar={aoUsar} />
            <Acao tipo="vip" loja={loja} aoUsar={aoUsar} />
          </div>
        </div>
      </div>
    </li>
  )
}

function Endereco({ loja }: { loja: Loja }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 py-0.5 pl-1 text-[13px] leading-snug font-semibold text-muted-2">
      <span className="flex min-w-[58%] flex-1 items-start gap-2">
        <MapPin aria-hidden="true" className="mt-0.5 size-[15px] shrink-0 text-pe" />
        {loja.endereco}
      </span>
      <a
        href={rotaGoogleMaps(loja)}
        target="_blank"
        rel="noopener"
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#EAF1FD] px-3 text-[13px] font-extrabold text-[#1E4FA3] no-underline transition-colors hover:bg-[#DCE8FC]"
      >
        <Navigation aria-hidden="true" className="size-3.5" />
        Como chegar
        <span className="sr-only"> (abre o Google Maps)</span>
      </a>
    </div>
  )
}
