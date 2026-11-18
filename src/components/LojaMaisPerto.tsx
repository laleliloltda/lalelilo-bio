/** Localizador de lojas: o mapa com todas as lojas e uma busca só — CEP, endereço, bairro, cidade ou nome da loja.
 *  Enquanto a pessoa digita, aparecem sugestões (cidades, bairros e lojas). Com um ponto de partida (busca ou
 *  localização do aparelho), o mapa mostra "Você" e a lista traz as lojas mais perto (até 20 km). Tocando numa loja
 *  (no mapa ou na lista), aparecem o endereço, "Como chegar", WhatsApp e Grupo VIP. */
import clsx from 'clsx'
import { ArrowRight, ChevronDown, ChevronUp, Info, LocateFixed, MapPin, Search, Store, X } from 'lucide-react'
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { ESTADOS, LOJAS, type Loja } from '@/data/lojas'
import { menosMovimento } from '@/lib/aparelho'
import { centroDe, ehCep, geocodificar, LugarNaoEncontrado, pareceCep, sugestoes, type Sugestao } from '@/lib/busca'
import { CepNaoEncontrado, localizarCep } from '@/lib/cep'
import { distanciaFalada, formatarDistancia, km, ordenarPorDistancia, type Ponto } from '@/lib/distancia'
import { bairroCidade } from '@/lib/loja'
import type { Alvo, Foco } from '@/lib/mapa'
import { formatarCep, mascaraCep, norm, soDigitos } from '@/lib/texto'

import { Acao } from './Acao'
import { Endereco, LojaItem } from './LojaItem'

const carregarMapa = () => import('./MapaLojas')
const MapaLojas = lazy(carregarMapa)

const PASSO = 5 // lojas por vez na lista
const RAIO_KM = 20 // a lista "mais perto" só mostra lojas até essa distância
const LONGE_KM = 120 // acima disso, "ainda não temos loja na sua região"
const ALTURA_MAPA = 'h-[clamp(250px,min(76vw,58vh),360px)]'

interface Origem extends Ponto {
  rotulo: string
  /** "CEP 51110-160", "“boa viagem”", "localização do aparelho" */
  detalhe: string | null
}

type Estado = { tipo: 'ocioso' } | { tipo: 'buscando'; via: 'texto' | 'geo' } | { tipo: 'erro'; texto: string }

/** Se o mapa não carregar (sem internet, bloqueio), a busca e a lista continuam funcionando. */
class SeOMapaFalhar extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() {
    return { falhou: true }
  }
  render() {
    if (!this.state.falhou) return this.props.children
    return (
      <div
        className={clsx(ALTURA_MAPA, 'grid place-items-center p-6 text-center text-[13.5px] font-bold text-muted-2')}
      >
        Não foi possível carregar o mapa agora. A busca continua funcionando.
      </div>
    )
  }
}

export function LojaMaisPerto({ aoUsar }: { aoUsar: (loja: Loja) => void }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' })
  const [origem, setOrigem] = useState<Origem | null>(null)
  const [mostrar, setMostrar] = useState(PASSO)
  const [aberta, setAberta] = useState<number | null>(null) // lista: loja aberta; visão geral: loja escolhida
  const [foco, setFoco] = useState<Foco>({ tipo: 'tudo', vez: 0 })
  const [anuncio, setAnuncio] = useState('')
  const [listaSugestoes, setListaSugestoes] = useState(false)
  const [ativa, setAtiva] = useState(-1)

  const pedido = useRef(0) // descarta respostas de buscas antigas
  const ultimaBusca = useRef('')
  const campo = useRef<HTMLInputElement>(null)
  const titulo = useRef<HTMLElement>(null)
  const cartao = useRef<HTMLDivElement>(null)
  const formulario = useRef<HTMLFormElement>(null)
  const caixaMapa = useRef<HTMLDivElement>(null)
  const cartaoLoja = useRef<HTMLDivElement>(null)
  const cabecas = useRef(new Map<number, HTMLButtonElement>())
  const botaoMais = useRef<HTMLButtonElement>(null)
  const focarResultado = useRef(false)
  const focarItem = useRef<number | null>(null)
  const focarAposMenos = useRef(false)

  const sug = useMemo(() => sugestoes(texto), [texto])
  const ordem = useMemo(() => (origem ? ordenarPorDistancia(origem, LOJAS) : []), [origem])
  // só as lojas num raio de 20 km (para a página não crescer demais); se não houver nenhuma, as 3 mais próximas
  const candidatas = useMemo(() => {
    const noRaio = ordem.filter((o) => o.distancia <= RAIO_KM)
    return noRaio.length ? noRaio : ordem.slice(0, 3)
  }, [ordem])
  const foraDoRaio = ordem.length > 0 && ordem[0].distancia > RAIO_KM
  const longe = ordem.length > 0 && ordem[0].distancia > LONGE_KM
  const visiveis = useMemo(() => candidatas.slice(0, mostrar), [candidatas, mostrar])
  const marcadores = useMemo(
    () => visiveis.map(({ item, distancia }, i) => ({ loja: item, numero: i + 1, distancia })),
    [visiveis],
  )
  const lojaEscolhida = !origem && aberta != null ? (LOJAS.find((l) => l.id === aberta) ?? null) : null
  const buscando = estado.tipo === 'buscando'
  const temGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const mostrarSugestoes = listaSugestoes && sug.length > 0 && !buscando
  const proximoFoco = (alvo: Alvo) => setFoco((atual) => ({ ...alvo, vez: atual.vez + 1 }))

  function mostrarResultado(p: Ponto, rotulo: string, detalhe: string | null) {
    const maisPerto = ordenarPorDistancia(p, LOJAS)[0]
    setOrigem({ lat: p.lat, lng: p.lng, rotulo, detalhe })
    setMostrar(PASSO)
    setAberta(null)
    setEstado({ tipo: 'ocioso' })
    setListaSugestoes(false)
    setAnuncio(
      `Encontramos as lojas mais perto de ${rotulo}. A mais perto é ${maisPerto.item.nome}, a ${distanciaFalada(maisPerto.distancia)}.`,
    )
    focarResultado.current = true
  }

  // resultado novo: o cartão continua o mesmo e a tela se ajeita para mostrar a busca e o mapa inteiro
  useEffect(() => {
    if (!origem || !focarResultado.current) return
    focarResultado.current = false
    titulo.current?.focus({ preventScroll: true }) // no celular, fecha o teclado para o mapa aparecer
    const card = cartao.current
    const form = formulario.current
    const mapa = caixaMapa.current
    if (!card || !form || !mapa) return
    const topoCard = card.getBoundingClientRect().top
    const fimMapa = mapa.getBoundingClientRect().bottom
    const altura = window.innerHeight
    if (topoCard >= 0 && fimMapa <= altura) return // já está tudo à vista
    const alvo = fimMapa - topoCard + 24 <= altura ? card : form
    alvo.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'start' })
  }, [origem])

  // visão geral: loja escolhida no mapa → o cartão dela aparece logo abaixo (e a tela acompanha)
  useEffect(() => {
    if (origem || aberta == null) return
    cartaoLoja.current?.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'nearest' })
  }, [aberta, origem])

  // "ver mais": o foco vai para a primeira loja nova
  useEffect(() => {
    if (focarItem.current == null) return
    const id = visiveis[focarItem.current]?.item.id
    focarItem.current = null
    if (id != null) cabecas.current.get(id)?.focus()
  }, [visiveis])

  // "mostrar menos": a lista volta às 5 primeiras e a tela volta junto, com o foco no "ver mais"
  useEffect(() => {
    if (!focarAposMenos.current) return
    focarAposMenos.current = false
    const b = botaoMais.current
    b?.focus({ preventScroll: true })
    b?.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'center' })
  }, [visiveis])

  async function buscarCep(digitos: string) {
    const n = ++pedido.current
    ultimaBusca.current = digitos
    setEstado({ tipo: 'buscando', via: 'texto' })
    try {
      const lugar = await localizarCep(digitos)
      if (n !== pedido.current) return
      const rotulo = [lugar.bairro, lugar.cidade].filter(Boolean).join(', ') || `o CEP ${formatarCep(digitos)}`
      mostrarResultado(lugar, rotulo, `CEP ${formatarCep(digitos)}`)
    } catch (e) {
      if (n !== pedido.current) return
      ultimaBusca.current = ''
      setEstado({
        tipo: 'erro',
        texto:
          e instanceof CepNaoEncontrado
            ? `Não encontramos o CEP ${formatarCep(digitos)}. Confira os números ou busque pelo bairro e a cidade.`
            : 'Não conseguimos buscar agora. Tente de novo em instantes ou use a sua localização.',
      })
    }
  }

  async function buscarEndereco(busca: string) {
    const n = ++pedido.current
    setEstado({ tipo: 'buscando', via: 'texto' })
    setListaSugestoes(false)
    try {
      const lugar = await geocodificar(busca)
      if (n !== pedido.current) return
      mostrarResultado(lugar, lugar.rotulo, `“${busca}”`)
    } catch (e) {
      if (n !== pedido.current) return
      setEstado({
        tipo: 'erro',
        texto:
          e instanceof LugarNaoEncontrado
            ? `Não encontramos “${busca}”. Tente o CEP, ou o bairro junto com a cidade (ex.: Boa Viagem, Recife).`
            : 'Não conseguimos buscar agora. Tente de novo em instantes ou use a sua localização.',
      })
    }
  }

  function verLoja(l: Loja) {
    pedido.current++
    setOrigem(null)
    setEstado({ tipo: 'ocioso' })
    setAberta(l.id)
    proximoFoco({ tipo: 'loja', id: l.id })
    setAnuncio(`${l.nome}, ${bairroCidade(l)}. Os contatos da loja estão logo abaixo do mapa.`)
  }

  /** Cidade ou bairro onde temos loja: parte do centro do lugar (OpenStreetMap); se não achar, do meio das lojas. */
  async function irParaLugar(s: Extract<Sugestao, { tipo: 'lugar' }>) {
    const n = ++pedido.current
    setEstado({ tipo: 'buscando', via: 'texto' })
    setListaSugestoes(false)
    let ponto: Ponto = centroDe(s.lojas)
    try {
      const achado = await geocodificar(`${s.rotulo}, ${ESTADOS[s.lojas[0].uf]}`)
      if (km(achado, ponto) < 30) ponto = achado // só aceita se cair perto das lojas (evita lugar com o mesmo nome)
    } catch {
      /* fica com o meio das lojas */
    }
    if (n !== pedido.current) return
    mostrarResultado(ponto, s.rotulo, null)
  }

  function escolher(s: Sugestao) {
    setListaSugestoes(false)
    setAtiva(-1)
    if (s.tipo === 'loja') {
      setTexto(s.loja.nome)
      verLoja(s.loja)
    } else if (s.tipo === 'lugar') {
      setTexto(s.rotulo)
      void irParaLugar(s)
    } else void buscarEndereco(s.texto)
  }

  function aoDigitar(valor: string) {
    if (estado.tipo === 'erro') setEstado({ tipo: 'ocioso' })
    if (estado.tipo === 'buscando' && estado.via === 'texto') {
      pedido.current++ // começou a digitar outra coisa: a busca anterior não vale mais
      setEstado({ tipo: 'ocioso' })
    }
    setAtiva(-1)
    if (pareceCep(valor)) {
      const mascara = mascaraCep(valor)
      setTexto(mascara)
      setListaSugestoes(false)
      const d = soDigitos(mascara)
      if (d.length === 8 && d !== ultimaBusca.current) void buscarCep(d) // completou o CEP: busca sozinho
      return
    }
    setTexto(valor)
    setListaSugestoes(true)
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (mostrarSugestoes && ativa >= 0) return escolher(sug[ativa])
    if (!t) return setEstado({ tipo: 'erro', texto: 'Digite um CEP, endereço, bairro ou cidade.' })
    if (ehCep(t)) return void buscarCep(soDigitos(t))
    if (pareceCep(t)) return setEstado({ tipo: 'erro', texto: 'Digite os 8 números do CEP.' })
    // nome exato de uma cidade, bairro ou loja que temos: usa direto; senão, procura o endereço no mapa
    const exata = sug.find((s) => s.tipo !== 'buscar' && norm(s.titulo) === norm(t))
    if (exata) return escolher(exata)
    void buscarEndereco(t)
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && sug.length) {
      e.preventDefault()
      setListaSugestoes(true)
      setAtiva((a) => (a + 1) % sug.length)
    } else if (e.key === 'ArrowUp' && sug.length) {
      e.preventDefault()
      setListaSugestoes(true)
      setAtiva((a) => (a <= 0 ? sug.length - 1 : a - 1))
    } else if (e.key === 'Escape') {
      setListaSugestoes(false)
      setAtiva(-1)
    }
  }

  /** Volta para a visão geral: todas as lojas no mapa. */
  function verTodas() {
    pedido.current++
    ultimaBusca.current = ''
    setTexto('')
    setOrigem(null)
    setAberta(null)
    setEstado({ tipo: 'ocioso' })
    setAnuncio('Mostrando todas as lojas no mapa.')
    proximoFoco({ tipo: 'tudo' })
  }

  function usarLocalizacao() {
    const n = ++pedido.current
    setEstado({ tipo: 'buscando', via: 'geo' })
    setListaSugestoes(false)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (n !== pedido.current) return
        setTexto('')
        ultimaBusca.current = ''
        mostrarResultado({ lat: p.coords.latitude, lng: p.coords.longitude }, 'Você', 'localização do aparelho')
      },
      (erro) => {
        if (n !== pedido.current) return
        setEstado({
          tipo: 'erro',
          texto:
            erro.code === erro.PERMISSION_DENIED
              ? 'Você não liberou a localização. Tudo bem: busque pelo CEP, bairro ou cidade.'
              : 'Não conseguimos pegar a sua localização. Busque pelo CEP, bairro ou cidade.',
        })
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    )
  }

  // tocou numa loja no mapa: com ponto de partida, abre a loja na lista; na visão geral, mostra o cartão dela
  const selecionarNoMapa = useCallback(
    (id: number) => {
      setAberta(id)
      if (!origem) return
      const el = cabecas.current.get(id)
      el?.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'nearest' })
      el?.focus({ preventScroll: true })
    },
    [origem],
  )

  function verMais() {
    focarItem.current = mostrar
    setMostrar((m) => Math.min(candidatas.length, m + PASSO))
  }

  function mostrarMenos() {
    focarAposMenos.current = true
    setMostrar(PASSO)
    setAberta((a) => (a != null && candidatas.findIndex((c) => c.item.id === a) >= PASSO ? null : a))
  }

  const mensagem =
    estado.tipo === 'erro'
      ? estado.texto
      : estado.tipo === 'buscando'
        ? estado.via === 'geo'
          ? 'Pedindo a sua localização ao aparelho…'
          : 'Procurando no mapa…'
        : ''

  return (
    <div
      ref={cartao}
      className="perto recorte relative mt-4 scroll-mt-3 rounded-[22px] border border-[#F5D9CB] p-4 max-[360px]:p-3"
    >
      <div className="flex items-center gap-3">
        <ArteMapa />
        <div>
          <h3 id="t-perto" className="font-display text-[19px] leading-tight font-semibold">
            Encontre a loja mais perto de você
          </h3>
          <p className="mt-1 text-[13.5px] leading-snug font-semibold text-muted-2">
            Busque pelo CEP, endereço, bairro ou cidade — ou explore o mapa.
          </p>
        </div>
      </div>

      <form
        ref={formulario}
        className="relative z-20 mt-3.5 scroll-mt-3"
        onSubmit={aoEnviar}
        noValidate
        role="search"
        aria-label="Buscar loja"
      >
        <label htmlFor="busca-loja" className="sr-only">
          CEP, endereço, bairro ou cidade
        </label>
        <div
          className={clsx(
            'flex h-14 items-center rounded-[18px] border-[1.5px] bg-white shadow-[0_10px_22px_-16px_rgba(140,45,15,.45)] transition',
            estado.tipo === 'erro'
              ? 'border-[#C0352B] shadow-[0_0_0_4px_rgba(192,53,43,.12)]'
              : 'border-[#EBDCD1] focus-within:border-pink focus-within:shadow-[0_0_0_4px_rgba(236,127,169,.2)]',
          )}
        >
          <Search aria-hidden="true" className="ml-3.5 size-5 shrink-0 text-pe" />
          <input
            ref={campo}
            id="busca-loja"
            type="text"
            role="combobox"
            aria-expanded={mostrarSugestoes}
            aria-controls="sugestoes-loja"
            aria-autocomplete="list"
            aria-activedescendant={mostrarSugestoes && ativa >= 0 ? `sugestao-${ativa}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder="CEP, endereço ou cidade"
            value={texto}
            onChange={(e) => aoDigitar(e.target.value)}
            onKeyDown={aoTeclar}
            onFocus={() => setListaSugestoes(true)}
            onBlur={() => window.setTimeout(() => setListaSugestoes(false), 150)}
            aria-invalid={estado.tipo === 'erro' || undefined}
            aria-describedby="busca-ajuda busca-msg"
            className="h-full min-w-0 flex-1 bg-transparent pr-1 pl-2 text-base font-bold outline-none placeholder:font-semibold placeholder:text-[#7C8199]"
          />
          {texto && (
            <button
              type="button"
              onClick={() => {
                if (origem || aberta != null) verTodas()
                else setTexto('')
                setListaSugestoes(false)
                campo.current?.focus()
              }}
              aria-label="Limpar a busca"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-2 hover:bg-soft"
            >
              <X aria-hidden="true" className="size-[17px]" strokeWidth={2.5} />
            </button>
          )}
          <button
            type="submit"
            aria-label="Buscar"
            className="mr-1.5 flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-linear-to-br from-pe to-pink-dd px-3.5 text-[15px] font-extrabold text-white shadow-[0_8px_16px_-10px_rgba(168,51,106,.95)] transition duration-150 ease-suave hover:brightness-105 active:scale-[.96] disabled:cursor-progress"
          >
            {buscando && estado.via === 'texto' ? (
              <span className="spin" aria-hidden="true" />
            ) : (
              <>
                <span className="max-[419px]:hidden">Buscar</span>
                <ArrowRight aria-hidden="true" className="size-[17px]" />
              </>
            )}
          </button>
        </div>

        {mostrarSugestoes && (
          <ul
            id="sugestoes-loja"
            role="listbox"
            aria-label="Sugestões"
            className="absolute inset-x-0 top-[calc(100%+6px)] max-h-[320px] overflow-auto rounded-2xl border border-line bg-white p-1.5 shadow-[0_18px_40px_-16px_rgba(47,52,80,.5)]"
          >
            {sug.map((s, i) => (
              <li
                key={s.chave}
                id={`sugestao-${i}`}
                role="option"
                aria-selected={i === ativa}
                onMouseDown={(e) => {
                  e.preventDefault() // não tira o foco do campo antes de escolher
                  escolher(s)
                }}
                onMouseEnter={() => setAtiva(i)}
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2',
                  i === ativa && 'bg-soft',
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    'grid size-8 shrink-0 place-items-center rounded-lg',
                    s.tipo === 'loja'
                      ? 'bg-[#FDE8F0] text-pe'
                      : s.tipo === 'lugar'
                        ? 'bg-[#EAF1FD] text-[#1E4FA3]'
                        : 'bg-soft text-muted-2',
                  )}
                >
                  {s.tipo === 'loja' ? (
                    <Store className="size-4" />
                  ) : s.tipo === 'lugar' ? (
                    <MapPin className="size-4" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-sm leading-tight font-extrabold">{s.titulo}</b>
                  <span className="block truncate text-xs font-semibold text-muted-2">{s.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="mx-1 mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span id="busca-ajuda" className="text-[12.5px] font-semibold text-muted-2">
          Ex.: 51110-160 · Boa Viagem · Caruaru
        </span>
        {temGeo && (
          <button
            type="button"
            onClick={usarLocalizacao}
            disabled={buscando}
            className="-mr-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-extrabold text-azul transition hover:bg-white/70 disabled:cursor-progress"
          >
            {buscando && estado.via === 'geo' ? (
              <span className="spin spin-azul" aria-hidden="true" />
            ) : (
              <LocateFixed aria-hidden="true" className="size-[17px]" />
            )}
            Usar minha localização
          </button>
        )}
      </div>

      <p
        id="busca-msg"
        role="status"
        aria-live="polite"
        className={clsx(
          'mx-1 flex items-start gap-2 text-[13.5px] leading-snug font-bold empty:hidden',
          mensagem && 'mt-2',
          estado.tipo === 'erro' ? 'text-[#B42318]' : 'text-muted-2',
        )}
      >
        {estado.tipo === 'erro' && (
          <span
            aria-hidden="true"
            className="mt-px grid size-[18px] shrink-0 place-items-center rounded-full bg-[#B42318] text-xs font-black text-white"
          >
            !
          </span>
        )}
        {mensagem}
      </p>

      {origem && (
        <div className="mx-0.5 mt-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[11.5px] font-extrabold tracking-[.06em] text-muted-2 uppercase">
                Lojas mais perto de
              </span>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <b
                  ref={titulo}
                  tabIndex={-1}
                  className="font-display text-[19px] leading-tight font-semibold outline-none"
                >
                  {origem.rotulo}
                </b>
                {origem.detalhe && (
                  <span className="max-w-full truncate rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-muted-2 ring-1 ring-[#EFDCCF]">
                    {origem.detalhe}
                  </span>
                )}
              </div>
            </div>
            {/* desfaz a busca e volta ao mapa inicial, com todas as lojas */}
            <button
              type="button"
              onClick={verTodas}
              className="mt-1 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-[#F3C8D9] bg-white px-3 text-[13px] font-extrabold text-pink-dd shadow-[0_6px_14px_-10px_rgba(168,51,106,.7)] transition hover:bg-[#FFF5F9] active:scale-[.97]"
            >
              <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
              Limpar busca
            </button>
          </div>
          {foraDoRaio && (
            <p className="mt-2.5 flex items-start gap-2.5 rounded-2xl bg-[#EEF3FB] px-[13px] py-3 text-[13.5px] leading-snug font-bold text-[#24406E]">
              <Info aria-hidden="true" className="mt-px size-[18px] shrink-0" />
              <span>
                {longe
                  ? `Ainda não temos loja na sua região. A mais perto fica a ${formatarDistancia(ordem[0].distancia)} — mas você pode falar com qualquer loja pelo WhatsApp.`
                  : `Não há loja num raio de ${RAIO_KM} km. Estas são as mais próximas — a primeira fica a ${formatarDistancia(ordem[0].distancia)}.`}
              </span>
            </p>
          )}
        </div>
      )}

      <div
        ref={caixaMapa}
        className="recorte relative isolate mt-3 rounded-[20px] border border-[#EADBD0] bg-[#F1ECE6] shadow-[0_12px_26px_-20px_rgba(47,52,80,.55)]"
      >
        <SeOMapaFalhar>
          <Suspense fallback={<div className={clsx('mapa-esqueleto', ALTURA_MAPA)} />}>
            <MapaLojas
              origem={origem}
              lojas={marcadores}
              selecionada={aberta}
              aoSelecionar={selecionarNoMapa}
              longe={longe}
              foco={foco}
            />
          </Suspense>
        </SeOMapaFalhar>
      </div>

      {!origem &&
        (lojaEscolhida ? (
          <div
            ref={cartaoLoja}
            className="mt-3 scroll-mb-3 animate-[entra_.35s_var(--ease-suave)_both] rounded-2xl border border-[#F3D9E3] bg-white p-3 shadow-[0_10px_24px_-18px_rgba(47,52,80,.5)]"
          >
            <div className="mb-1 flex items-start justify-between gap-2 pl-1">
              <div className="min-w-0">
                <b className="block text-base leading-tight font-extrabold">{lojaEscolhida.nome}</b>
                <span className="text-[12.5px] font-semibold text-muted-2">
                  {bairroCidade(lojaEscolhida)} · {lojaEscolhida.uf}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAberta(null)}
                aria-label="Fechar os detalhes da loja"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-2 hover:bg-soft"
              >
                <X aria-hidden="true" className="size-[17px]" strokeWidth={2.5} />
              </button>
            </div>
            <div className="grid gap-2">
              <Endereco loja={lojaEscolhida} />
              <Acao tipo="wa" loja={lojaEscolhida} aoUsar={aoUsar} />
              <Acao tipo="vip" loja={lojaEscolhida} aoUsar={aoUsar} />
            </div>
          </div>
        ) : (
          <p className="mx-1 mt-3 text-[12.5px] leading-snug font-semibold text-muted-2">
            Toque numa loja no mapa para ver os contatos. Os números juntam lojas próximas: toque neles para aproximar.
          </p>
        ))}

      {origem && (
        <>
          <ol className="lista-perto mt-2.5" aria-label="Lojas da mais perto para a mais longe">
            {visiveis.map(({ item: loja, distancia }, i) => (
              <LojaItem
                key={loja.id}
                loja={loja}
                aberta={aberta === loja.id}
                aoAlternar={() => setAberta((a) => (a === loja.id ? null : loja.id))}
                aoUsar={aoUsar}
                numero={i + 1}
                distancia={distancia}
                maisPerto={i === 0 && !longe}
                indice={i % PASSO}
                cabecaRef={(el) => {
                  if (el) cabecas.current.set(loja.id, el)
                  else cabecas.current.delete(loja.id)
                }}
              />
            ))}
          </ol>

          {candidatas.length > PASSO && (
            <div className={clsx('mt-2.5 grid gap-2', mostrar > PASSO && mostrar < candidatas.length && 'grid-cols-2')}>
              {mostrar < candidatas.length && (
                <button
                  ref={botaoMais}
                  type="button"
                  onClick={verMais}
                  className="flex h-[46px] items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#E3D7CC] text-sm font-extrabold hover:bg-white/60"
                >
                  Ver mais lojas <ChevronDown aria-hidden="true" className="size-4" />
                </button>
              )}
              {mostrar > PASSO && (
                <button
                  type="button"
                  onClick={mostrarMenos}
                  className="flex h-[46px] items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-[#E3D7CC] bg-white/70 text-sm font-extrabold hover:bg-white"
                >
                  Mostrar menos <ChevronUp aria-hidden="true" className="size-4" />
                </button>
              )}
            </div>
          )}
          <p className="mx-1 mt-2.5 text-xs leading-normal font-semibold text-muted-2">
            {!foraDoRaio &&
              (candidatas.length > PASSO
                ? `Mostrando ${visiveis.length} de ${candidatas.length} lojas num raio de ${RAIO_KM} km. `
                : `Lojas num raio de ${RAIO_KM} km. `)}
            Distâncias em linha reta. O que você busca serve só para achar a loja: não guardamos nada.
          </p>
        </>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>
    </div>
  )
}

/** Ilustração: mapinha com o pino da loja pulando e o caminho até você. */
function ArteMapa() {
  return (
    <svg className="h-16 w-[84px] shrink-0" viewBox="0 0 96 72" aria-hidden="true" focusable="false">
      <rect x="3" y="12" width="90" height="56" rx="15" fill="#fff" stroke="#F2D6C4" strokeWidth="2" />
      <path d="M3 44c18-7 30 9 50 1s28-15 40-8" fill="none" stroke="#FAD9C0" strokeWidth="7" strokeLinecap="round" />
      <path d="M31 13v54M66 13v54" stroke="#F6E6DA" strokeWidth="3" />
      <path
        d="M19 57c10-5 24-9 39-24"
        fill="none"
        stroke="#7A8FB0"
        strokeWidth="2.5"
        strokeDasharray="4 5"
        strokeLinecap="round"
      />
      <circle cx="19" cy="57" r="7" fill="#2F6FDB" opacity=".18" />
      <circle cx="19" cy="57" r="4" fill="#2F6FDB" stroke="#fff" strokeWidth="1.5" />
      <g className="pin-pula">
        <path
          d="M62 6c-7.2 0-12.5 5.4-12.5 12 0 8.6 12.5 19 12.5 19s12.5-10.4 12.5-19C74.5 11.4 69.2 6 62 6z"
          fill="#EC7FA9"
        />
        <circle cx="62" cy="18" r="4.8" fill="#fff" />
      </g>
    </svg>
  )
}
