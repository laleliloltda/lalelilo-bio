/** Cartão "Nossas lojas": a loja salva no aparelho e o localizador (mapa com todas as lojas e busca por CEP,
 *  endereço, bairro, cidade ou nome da loja). */
import { Crown, MapPin } from 'lucide-react'
import { useState } from 'react'

import { LOJAS, type Loja } from '@/data/lojas'
import { lerMinhaLoja, salvarMinhaLoja } from '@/lib/aparelho'

import { Acao } from './Acao'
import { WhatsApp } from './icones'
import { LojaMaisPerto } from './LojaMaisPerto'

export function Lojas() {
  const [minha, setMinha] = useState<string | null>(() => lerMinhaLoja())
  const minhaLoja = LOJAS.find((l) => l.nome === minha) ?? null

  const usar = (l: Loja) => {
    salvarMinhaLoja(l.nome)
    setMinha(l.nome)
  }

  return (
    <section
      className="reveal faixa-marca recorte relative mt-[26px] rounded-card bg-card px-[18px] pt-[22px] pb-[18px] shadow-card max-[360px]:px-3.5 [animation-delay:.05s]"
      aria-labelledby="t-lojas"
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[.06em] text-pink-d uppercase">
        <MapPin aria-hidden="true" className="size-3.5" /> Nossas lojas
      </span>
      <h2
        id="t-lojas"
        className="mt-1.5 font-display text-[26px] leading-[1.15] font-bold tracking-[-.015em] max-[360px]:text-[23px]"
      >
        Fale com a Lalelilo mais perto de você
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Escolha a sua loja para falar com a equipe pelo{' '}
        <span className="inline-flex items-center gap-1 align-bottom font-extrabold whitespace-nowrap text-wa-text">
          <WhatsApp className="size-[15px]" />
          WhatsApp
        </span>{' '}
        ou entrar no{' '}
        <span className="inline-flex items-center gap-1 align-bottom font-extrabold whitespace-nowrap text-pink-d">
          <Crown aria-hidden="true" className="size-[15px]" />
          Grupo VIP
        </span>{' '}
        e receber as novidades em primeira mão.
      </p>

      {minhaLoja && (
        <div className="mt-4 rounded-[20px] border border-[#F7DCE6] bg-linear-to-br from-[#FFF1F6] to-[#FFF5E8] p-3.5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11.5px] font-extrabold tracking-[.06em] text-muted uppercase">Sua loja</div>
              <div className="mt-px font-display text-[19px] font-semibold">{minhaLoja.nome}</div>
            </div>
            <button
              type="button"
              className="py-1.5 text-[13px] font-bold text-pink-dd underline underline-offset-[3px]"
              onClick={() => {
                salvarMinhaLoja(null)
                setMinha(null)
                document.getElementById('busca-loja')?.focus()
              }}
            >
              Trocar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 max-[360px]:grid-cols-1">
            <Acao tipo="wa" loja={minhaLoja} mini />
            <Acao tipo="vip" loja={minhaLoja} mini />
          </div>
        </div>
      )}

      <LojaMaisPerto aoUsar={usar} />
    </section>
  )
}
