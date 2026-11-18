/** Cartão "Nossas lojas": a loja salva no aparelho, a busca pela loja mais perto (CEP/localização) e a lista
 *  completa com busca por nome, bairro ou cidade e filtro por estado. */
import clsx from 'clsx'
import { ChevronDown, Crown, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ESTADOS, LOJAS, ORDEM_UF, type Loja, type UF } from '@/data/lojas'
import { lerMinhaLoja, salvarMinhaLoja } from '@/lib/aparelho'
import { norm } from '@/lib/texto'

import { Acao } from './Acao'
import { WhatsApp } from './icones'
import { LojaItem } from './LojaItem'
import { LojaMaisPerto } from './LojaMaisPerto'

const INICIAL = 6 // lojas visíveis antes de "ver todas"
const CHAVE_BUSCA = new Map(LOJAS.map((l) => [l.id, norm(`${l.nome} ${ESTADOS[l.uf]} ${l.endereco}`)]))
const POR_UF = Object.fromEntries(ORDEM_UF.map((uf) => [uf, LOJAS.filter((l) => l.uf === uf).length])) as Record<
  UF,
  number
>

export function Lojas() {
  const [filtro, setFiltro] = useState<UF | 'todas'>('todas')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState(false)
  const [aberta, setAberta] = useState<number | null>(null)
  const [minha, setMinha] = useState<string | null>(() => lerMinhaLoja())
  const campoBusca = useRef<HTMLInputElement>(null)
  const cabecas = useRef(new Map<number, HTMLButtonElement>())
  const focarAposExpandir = useRef(false)

  const termo = norm(busca.trim())
  const minhaLoja = LOJAS.find((l) => l.nome === minha) ?? null
  const lista = useMemo(
    () =>
      LOJAS.filter(
        (l) => (filtro === 'todas' || l.uf === filtro) && (!termo || CHAVE_BUSCA.get(l.id)!.includes(termo)),
      ),
    [filtro, termo],
  )
  const corta = !termo && filtro === 'todas' && !expandido && lista.length > INICIAL
  const visiveis = corta ? lista.slice(0, INICIAL) : lista

  const usar = (l: Loja) => {
    salvarMinhaLoja(l.nome)
    setMinha(l.nome)
  }

  // "ver todas": o foco vai para a primeira loja que apareceu
  useEffect(() => {
    if (!expandido || !focarAposExpandir.current) return
    focarAposExpandir.current = false
    const id = lista[INICIAL]?.id
    if (id != null) cabecas.current.get(id)?.focus()
  }, [expandido, lista])

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
                campoBusca.current?.focus()
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

      <div className="divisor mx-0.5 mt-[18px] text-xs font-extrabold tracking-[.08em] text-muted-2 uppercase">
        ou procure na lista
      </div>

      <div className="relative mt-3">
        <Search aria-hidden="true" className="absolute top-1/2 left-[15px] size-[18px] -translate-y-1/2 text-muted" />
        <input
          ref={campoBusca}
          type="search"
          inputMode="search"
          autoComplete="off"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Busque por cidade, bairro ou shopping"
          aria-label="Buscar loja por cidade, bairro ou shopping"
          className="h-[50px] w-full rounded-2xl border-[1.5px] border-line bg-[#FCFAF8] pr-3.5 pl-11 text-base font-semibold text-ink transition placeholder:font-semibold placeholder:text-[#7C8199] focus:border-pink focus:bg-white focus:shadow-[0_0_0_4px_rgba(236,127,169,.15)] focus:outline-none"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
        {(['todas', ...ORDEM_UF] as const).map((uf) => (
          <button
            key={uf}
            type="button"
            aria-pressed={filtro === uf}
            title={uf === 'todas' ? undefined : `${POR_UF[uf]} lojas`}
            onClick={() => setFiltro(uf)}
            className="h-9 flex-auto rounded-full border-[1.5px] border-line bg-white px-[9px] text-[13px] font-bold text-muted transition aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
          >
            {uf === 'todas' ? 'Todas' : ESTADOS[uf]}
          </button>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {termo || filtro !== 'todas'
          ? `${lista.length} ${lista.length === 1 ? 'loja encontrada' : 'lojas encontradas'}`
          : ''}
      </p>

      {!lista.length ? (
        <div className="px-2 py-[22px] text-center text-sm text-muted">
          <b className="mb-0.5 block font-display text-[17px] font-semibold text-ink">Nenhuma loja encontrada</b>
          Tente outro nome de cidade, bairro ou shopping.
        </div>
      ) : (
        ORDEM_UF.map((uf) => {
          const doEstado = visiveis.filter((l) => l.uf === uf)
          if (!doEstado.length) return null
          return (
            <div key={uf}>
              {filtro === 'todas' ? (
                <h3 className="mx-1 mt-4 mb-1.5 flex items-center gap-2 text-xs font-extrabold tracking-[.06em] text-muted uppercase after:h-px after:flex-1 after:bg-line">
                  {ESTADOS[uf]}
                </h3>
              ) : (
                <div className="h-2.5" />
              )}
              <ul>
                {doEstado.map((l) => (
                  <LojaItem
                    key={l.id}
                    loja={l}
                    aberta={aberta === l.id}
                    aoAlternar={() => setAberta((a) => (a === l.id ? null : l.id))}
                    aoUsar={usar}
                    termo={termo}
                    cabecaRef={(el) => {
                      if (el) cabecas.current.set(l.id, el)
                      else cabecas.current.delete(l.id)
                    }}
                  />
                ))}
              </ul>
            </div>
          )
        })
      )}

      {corta && (
        <button
          type="button"
          onClick={() => {
            focarAposExpandir.current = true
            setExpandido(true)
          }}
          className={clsx(
            'mt-2.5 flex h-[46px] w-full items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#E3D7CC] text-sm font-extrabold hover:bg-soft',
          )}
        >
          Ver todas as {lista.length} lojas <ChevronDown aria-hidden="true" className="size-4" />
        </button>
      )}
    </section>
  )
}
