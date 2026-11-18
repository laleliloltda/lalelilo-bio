import clsx from 'clsx'
import { ArrowUpRight, Crown } from 'lucide-react'

import type { Loja } from '@/data/lojas'
import { linkOk } from '@/lib/texto'

import { WhatsApp } from './icones'

interface Props {
  tipo: 'wa' | 'vip'
  loja: Loja
  /** versão compacta (bloco "Sua loja") */
  mini?: boolean
  /** chamado ao abrir o link: a loja passa a ser "a sua loja" neste aparelho */
  aoUsar?: (loja: Loja) => void
}

/** Cartão de ação: chamar a loja no WhatsApp ou entrar no Grupo VIP. */
export function Acao({ tipo, loja, mini = false, aoUsar }: Props) {
  const wa = tipo === 'wa'
  const url = wa ? loja.wa : loja.vip
  const tem = linkOk(url)
  const titulo = mini ? (wa ? 'WhatsApp' : 'Grupo VIP') : wa ? 'Chamar no WhatsApp' : 'Entrar no Grupo VIP'
  const sub = tem ? (wa ? 'Fale com a equipe da loja' : 'Novidades em primeira mão') : 'Em breve'
  const icone = mini ? 'size-[19px]' : 'size-[22px]'

  return (
    <a
      className={clsx(
        'group flex items-center border border-[#F1E9E2] bg-white no-underline shadow-acao transition duration-200 ease-suave',
        'hover:-translate-y-px hover:shadow-acao-hover active:scale-[.985]',
        mini ? 'gap-2.5 rounded-2xl p-2' : 'gap-3 rounded-[18px] p-2.5',
        wa ? 'hover:border-[#BDEFD0]' : 'hover:border-[#F7CFDF]',
        !tem && 'pointer-events-none opacity-50',
      )}
      href={tem ? url : undefined}
      aria-disabled={tem ? undefined : true}
      target="_blank"
      rel="noopener"
      onClick={() => tem && aoUsar?.(loja)}
    >
      <span
        className={clsx(
          'relative grid shrink-0 place-items-center text-white',
          mini ? 'size-9 rounded-xl' : 'size-11 rounded-[14px]',
          wa
            ? 'bg-wa shadow-[0_6px_14px_-6px_rgba(37,211,102,.8)]'
            : 'acao-vip bg-linear-to-br from-pink to-orange shadow-[0_6px_14px_-6px_rgba(214,90,140,.8)]',
        )}
      >
        {wa ? <WhatsApp className={icone} /> : <Crown aria-hidden="true" className={icone} />}
      </span>
      <span className="min-w-0 flex-1">
        <b className={clsx('block leading-tight font-extrabold', mini ? 'text-sm' : 'text-[15px]')}>{titulo}</b>
        {!mini && <small className="mt-px block text-[12.5px] font-semibold text-muted">{sub}</small>}
      </span>
      {!mini && (
        <span
          className={clsx(
            'grid size-8 shrink-0 place-items-center rounded-full bg-soft text-ink transition-colors',
            wa ? 'group-hover:bg-wa group-hover:text-white' : 'group-hover:bg-pink-d group-hover:text-white',
          )}
        >
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-suave group-hover:translate-x-px group-hover:-translate-y-px"
          />
        </span>
      )}
      <span className="sr-only"> (abre o WhatsApp)</span>
    </a>
  )
}
