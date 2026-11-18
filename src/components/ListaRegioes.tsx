/** Lista completa, organizada por região: seis linhas curtas (com o número de lojas e as principais cidades) que
 *  abrem uma de cada vez e mostram as lojas numa grade de duas colunas. Ao tocar numa loja, o endereço, "Como
 *  chegar", WhatsApp e Grupo VIP aparecem logo abaixo dela. Com algo digitado na busca, mostra só o que achou. */
import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { Fragment, useMemo, useRef, useState, type ReactNode } from 'react'

import { ESTADOS, LOJAS, type Loja, type UF } from '@/data/lojas'
import { REGIOES, regiaoDe, type Regiao } from '@/data/regioes'
import { menosMovimento } from '@/lib/aparelho'
import { soltarBrilhos } from '@/lib/brilho'
import { cidadeDe } from '@/lib/loja'
import { norm } from '@/lib/texto'

import { Acao } from './Acao'
import { Endereco } from './LojaItem'

const COR_NUMERO: Record<UF, string> = { PE: 'bg-pe', AL: 'bg-al', PB: 'bg-pb' }
const COR_FAIXA: Record<UF, string> = { PE: 'border-l-pink', AL: 'border-l-orange', PB: 'border-l-green' }
const MAX_SEM_FILTRO = 8 // região com mais lojas que isso ganha botões de cidade (hoje: Recife e RMR)
const NOME_CURTO: Record<string, string> = { 'Jaboatão dos Guararapes': 'Jaboatão', 'Cabo de Santo Agostinho': 'Cabo' }
const OUTRAS = '*outras'

/** Botões de cidade: as cidades com 2 ou mais lojas e, juntas, as de uma loja só ("Outras cidades"). */
function filtrosDeCidade(lojas: Loja[]) {
  const porCidade = new Map<string, number>()
  lojas.forEach((l) => porCidade.set(cidadeDe(l), (porCidade.get(cidadeDe(l)) ?? 0) + 1))
  const grandes = [...porCidade].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])
  const outras = lojas.filter((l) => porCidade.get(cidadeDe(l))! < 2).length
  return [
    ...grandes.map(([cidade, n]) => ({ id: cidade, nome: NOME_CURTO[cidade] ?? cidade, n })),
    ...(outras ? [{ id: OUTRAS, nome: 'Outras cidades', n: outras }] : []),
  ]
}

function lojasDoFiltro(lojas: Loja[], filtro: string) {
  if (filtro !== OUTRAS) return lojas.filter((l) => cidadeDe(l) === filtro)
  const porCidade = new Map<string, number>()
  lojas.forEach((l) => porCidade.set(cidadeDe(l), (porCidade.get(cidadeDe(l)) ?? 0) + 1))
  return lojas.filter((l) => porCidade.get(cidadeDe(l))! < 2)
}

const CHAVE_BUSCA = new Map(LOJAS.map((l) => [l.id, norm(`${l.nome} ${ESTADOS[l.uf]} ${l.endereco}`)]))

/** Lojas da região na ordem de quem procura: a cidade com mais lojas primeiro, depois por nome. */
function ordenar(lojas: Loja[]) {
  const porCidade = new Map<string, number>()
  lojas.forEach((l) => porCidade.set(cidadeDe(l), (porCidade.get(cidadeDe(l)) ?? 0) + 1))
  return [...lojas].sort(
    (a, b) =>
      porCidade.get(cidadeDe(b))! - porCidade.get(cidadeDe(a))! ||
      cidadeDe(a).localeCompare(cidadeDe(b), 'pt-BR') ||
      a.nome.localeCompare(b.nome, 'pt-BR'),
  )
}

/** "Recife · Camaragibe · Jaboatão dos Guararapes e mais 8" (até 2 linhas no cabeçalho) */
function cidadesResumo(lojas: Loja[]) {
  const cidades = [...new Set(lojas.map(cidadeDe))]
  if (cidades.length <= 3) return cidades.join(' · ')
  return `${cidades.slice(0, 3).join(' · ')} e mais ${cidades.length - 3}`
}

function realce(nome: string, termo: string): ReactNode {
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

interface Props {
  /** termo da busca, já sem acento */
  termo: string
  aoUsar: (loja: Loja) => void
}

export function ListaRegioes({ termo, aoUsar }: Props) {
  const [regiaoAberta, setRegiaoAberta] = useState<Regiao | null>(null)
  const [lojaAberta, setLojaAberta] = useState<number | null>(null)
  const [filtroCidade, setFiltroCidade] = useState<string | null>(null)
  const cabecalhos = useRef(new Map<Regiao, HTMLButtonElement>())
  const buscando = termo.length > 0

  const grupos = useMemo(
    () =>
      REGIOES.map((r) => {
        const todas = LOJAS.filter((l) => regiaoDe(l) === r.id)
        const achadas = termo ? todas.filter((l) => CHAVE_BUSCA.get(l.id)!.includes(termo)) : todas
        return { ...r, lojas: ordenar(achadas), resumo: cidadesResumo(ordenar(todas)) }
      }).filter((g) => g.lojas.length > 0),
    [termo],
  )
  const total = grupos.reduce((n, g) => n + g.lojas.length, 0)

  function alternarRegiao(id: Regiao) {
    const abrindo = regiaoAberta !== id
    setRegiaoAberta(abrindo ? id : null)
    setLojaAberta(null)
    setFiltroCidade(null)
    // a região de cima pode ter fechado: depois da animação, garante que o título desta continua à vista
    if (abrindo) {
      window.setTimeout(
        () =>
          cabecalhos.current
            .get(id)
            ?.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'nearest' }),
        380,
      )
    }
  }

  return (
    <div className="mt-3">
      <p className="sr-only" role="status" aria-live="polite">
        {buscando ? `${total} ${total === 1 ? 'loja encontrada' : 'lojas encontradas'}` : ''}
      </p>

      {!grupos.length && (
        <div className="px-2 py-[22px] text-center text-sm text-muted">
          <b className="mb-0.5 block font-display text-[17px] font-semibold text-ink">Nenhuma loja encontrada</b>
          Tente outro nome de cidade, bairro ou shopping.
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {grupos.map((g) => {
          const aberta = buscando || regiaoAberta === g.id
          const idPainel = `regiao-${g.id}`
          // região grande (sem busca): botões de cidade e a grade só com a cidade escolhida
          const filtros = !buscando && g.lojas.length > MAX_SEM_FILTRO ? filtrosDeCidade(g.lojas) : []
          const filtro = filtros.length ? (filtroCidade ?? filtros[0].id) : null
          const mostradas = filtro ? lojasDoFiltro(g.lojas, filtro) : g.lojas
          return (
            <div key={g.id} className={clsx('rounded-[18px] transition-colors', aberta && 'bg-soft')}>
              <h3>
                <button
                  ref={(el) => {
                    if (el) cabecalhos.current.set(g.id, el)
                    else cabecalhos.current.delete(g.id)
                  }}
                  type="button"
                  aria-expanded={aberta}
                  aria-controls={idPainel}
                  disabled={buscando}
                  onClick={() => alternarRegiao(g.id)}
                  className={clsx(
                    'flex w-full scroll-mt-3 items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition',
                    aberta
                      ? 'border-transparent'
                      : 'border-line bg-white shadow-[0_6px_16px_-12px_rgba(47,52,80,.35)] hover:border-[#E3D3C8]',
                    buscando && 'cursor-default',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'grid size-10 shrink-0 place-items-center rounded-xl text-base font-black text-white shadow-[0_5px_12px_-7px_rgba(47,52,80,.8)]',
                      COR_NUMERO[g.uf],
                    )}
                  >
                    {g.lojas.length}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15px] leading-tight font-extrabold">{g.nome}</b>
                    <span className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug font-semibold text-muted-2">
                      <span className="sr-only">
                        {g.lojas.length} {g.lojas.length === 1 ? 'loja' : 'lojas'}:{' '}
                      </span>
                      {buscando ? `${g.lojas.length} ${g.lojas.length === 1 ? 'loja' : 'lojas'}` : g.resumo}
                    </span>
                  </span>
                  {!buscando && (
                    <ChevronDown
                      aria-hidden="true"
                      className={clsx(
                        'size-[18px] shrink-0 text-[#B5B8C9] transition-transform duration-300 ease-suave',
                        aberta && 'rotate-180 text-pink-d',
                      )}
                    />
                  )}
                </button>
              </h3>

              <div id={idPainel} className={clsx('sanfona', aberta && 'aberta')}>
                <div className="sanfona-dentro">
                  {filtro && (
                    <div
                      role="group"
                      aria-label={`Cidades de ${g.nome}`}
                      className="flex flex-wrap gap-1.5 px-2 pt-1 pb-2"
                    >
                      {filtros.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          aria-pressed={filtro === f.id}
                          onClick={() => {
                            setFiltroCidade(f.id)
                            setLojaAberta(null)
                          }}
                          className="group flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-line bg-white pr-1.5 pl-3 text-[13px] font-bold text-muted-2 transition aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                        >
                          {f.nome}
                          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-soft px-1.5 text-[11.5px] font-extrabold text-ink group-aria-pressed:bg-white/20 group-aria-pressed:text-white">
                            {f.n}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* grade de 2 colunas; o detalhe da loja ocupa a linha inteira logo abaixo dela (grid "dense") */}
                  <div className="grid grid-flow-row-dense grid-cols-2 gap-2 px-2 pt-1 pb-2.5">
                    {mostradas.map((l) => {
                      const ativa = lojaAberta === l.id
                      return (
                        <Fragment key={l.id}>
                          <button
                            type="button"
                            aria-expanded={ativa}
                            aria-controls={`loja-${l.id}`}
                            onClick={(e) => {
                              if (!ativa) soltarBrilhos(e.currentTarget)
                              setLojaAberta(ativa ? null : l.id)
                            }}
                            className={clsx(
                              'flex min-h-[58px] flex-col justify-center rounded-[14px] border border-l-4 bg-white px-2.5 py-2 text-left transition duration-200 ease-suave',
                              COR_FAIXA[l.uf],
                              ativa
                                ? 'border-[#F3C8D9] shadow-[0_0_0_3px_rgba(236,127,169,.22)]'
                                : 'border-[#F1E9E2] hover:-translate-y-px hover:shadow-acao',
                            )}
                          >
                            <b className="line-clamp-2 text-[13.5px] leading-tight font-extrabold">
                              {realce(l.nome, termo)}
                            </b>
                            <span className="mt-0.5 truncate text-xs font-semibold text-muted-2">{cidadeDe(l)}</span>
                          </button>
                          {ativa && (
                            <div
                              id={`loja-${l.id}`}
                              className="col-span-2 animate-[entra_.35s_var(--ease-suave)_both] rounded-2xl border border-[#F3D9E3] bg-white/90 p-2.5"
                            >
                              <Endereco loja={l} />
                              <div className="mt-2 grid grid-cols-2 gap-2 max-[340px]:grid-cols-1">
                                <Acao tipo="wa" loja={l} mini aoUsar={aoUsar} />
                                <Acao tipo="vip" loja={l} mini aoUsar={aoUsar} />
                              </div>
                            </div>
                          )}
                        </Fragment>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
