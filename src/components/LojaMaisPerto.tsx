/** "Qual loja fica mais perto de você?": a pessoa digita o CEP (ou usa a localização do aparelho) e vê no mapa
 *  e numa lista as lojas mais próximas; ao tocar numa loja, aparecem o endereço, "Como chegar", WhatsApp e Grupo VIP. */
import clsx from 'clsx'
import { ArrowRight, ChevronDown, ChevronUp, Info, LocateFixed, MapPin, X } from 'lucide-react'
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
  type ReactNode,
} from 'react'

import { LOJAS, type Loja } from '@/data/lojas'
import { menosMovimento } from '@/lib/aparelho'
import { CepNaoEncontrado, localizarCep } from '@/lib/cep'
import { distanciaFalada, formatarDistancia, ordenarPorDistancia, type Ponto } from '@/lib/distancia'
import { formatarCep, mascaraCep, soDigitos } from '@/lib/texto'

import { LojaItem } from './LojaItem'

const carregarMapa = () => import('./MapaLojas')
const MapaLojas = lazy(carregarMapa)

const PASSO = 5 // lojas por vez na lista
const RAIO_KM = 20 // a lista "mais perto" só mostra lojas até essa distância
const LONGE_KM = 120 // acima disso, "ainda não temos loja na sua região"
const ALTURA_MAPA = 'h-[clamp(220px,min(64vw,52vh),310px)]'

interface Origem extends Ponto {
  rotulo: string
  cep: string | null
}

type Estado = { tipo: 'ocioso' } | { tipo: 'buscando'; via: 'cep' | 'geo' } | { tipo: 'erro'; texto: string }

/** Se o mapa não carregar (sem internet, bloqueio), a lista continua funcionando. */
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
        Não foi possível carregar o mapa agora. As lojas mais perto estão na lista abaixo.
      </div>
    )
  }
}

export function LojaMaisPerto({ aoUsar }: { aoUsar: (loja: Loja) => void }) {
  const [cep, setCep] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' })
  const [origem, setOrigem] = useState<Origem | null>(null)
  const [mostrar, setMostrar] = useState(PASSO)
  const [aberta, setAberta] = useState<number | null>(null)
  const [anuncio, setAnuncio] = useState('')

  const pedido = useRef(0) // descarta respostas de buscas antigas
  const ultimoCep = useRef('')
  const campoCep = useRef<HTMLInputElement>(null)
  const titulo = useRef<HTMLElement>(null)
  const cartao = useRef<HTMLDivElement>(null)
  const formulario = useRef<HTMLFormElement>(null)
  const caixaMapa = useRef<HTMLDivElement>(null)
  const cabecas = useRef(new Map<number, HTMLButtonElement>())
  const focarResultado = useRef(false)
  const focarItem = useRef<number | null>(null)
  const focarAposMenos = useRef(false)
  const botaoMais = useRef<HTMLButtonElement>(null)

  const ordem = useMemo(() => (origem ? ordenarPorDistancia(origem, LOJAS) : []), [origem])
  // só as lojas num raio de 20 km (para a página não crescer demais); se não houver nenhuma, as 3 mais próximas
  const candidatas = useMemo(() => {
    const noRaio = ordem.filter((o) => o.distancia <= RAIO_KM)
    return noRaio.length ? noRaio : ordem.slice(0, 3)
  }, [ordem])
  const foraDoRaio = ordem.length > 0 && ordem[0].distancia > RAIO_KM
  const visiveis = useMemo(() => candidatas.slice(0, mostrar), [candidatas, mostrar])
  const marcadores = useMemo(
    () => visiveis.map(({ item, distancia }, i) => ({ loja: item, numero: i + 1, distancia })),
    [visiveis],
  )
  const longe = ordem.length > 0 && ordem[0].distancia > LONGE_KM
  const temGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const buscando = estado.tipo === 'buscando'

  function mostrarResultado(p: Ponto, rotulo: string, cepBuscado: string | null) {
    const maisPerto = ordenarPorDistancia(p, LOJAS)[0]
    setOrigem({ lat: p.lat, lng: p.lng, rotulo, cep: cepBuscado })
    setMostrar(PASSO)
    setAberta(null)
    setEstado({ tipo: 'ocioso' })
    setAnuncio(
      `Encontramos as lojas mais perto de ${rotulo}. A mais perto é ${maisPerto.item.nome}, a ${distanciaFalada(maisPerto.distancia)}.`,
    )
    focarResultado.current = true
  }

  // resultado novo: o cartão continua o mesmo (nada some) e a tela se ajeita para mostrar o campo do CEP e o mapa
  // inteiro — o cartão todo, se couber; senão, o campo do CEP no alto. Só rola se precisar.
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

  // "Trocar CEP": volta ao campo, com o CEP selecionado para digitar outro
  function editarCep() {
    const el = campoCep.current
    if (!el) return
    el.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
    el.select()
  }

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

  function verMais() {
    focarItem.current = mostrar
    setMostrar((m) => Math.min(candidatas.length, m + PASSO))
  }

  function mostrarMenos() {
    focarAposMenos.current = true
    setMostrar(PASSO)
    setAberta((a) => (a != null && candidatas.findIndex((c) => c.item.id === a) >= PASSO ? null : a))
  }

  async function buscarCep(digitos: string) {
    const n = ++pedido.current
    ultimoCep.current = digitos
    setEstado({ tipo: 'buscando', via: 'cep' })
    void carregarMapa().catch(() => {}) // adianta o download do mapa
    try {
      const lugar = await localizarCep(digitos)
      if (n !== pedido.current) return
      mostrarResultado(
        lugar,
        [lugar.bairro, lugar.cidade].filter(Boolean).join(', ') || `o CEP ${formatarCep(digitos)}`,
        digitos,
      )
    } catch (e) {
      if (n !== pedido.current) return
      ultimoCep.current = ''
      setEstado({
        tipo: 'erro',
        texto:
          e instanceof CepNaoEncontrado
            ? `Não encontramos o CEP ${formatarCep(digitos)}. Confira os números ou use a sua localização.`
            : 'Não conseguimos buscar o CEP agora. Tente de novo em instantes ou use a sua localização.',
      })
    }
  }

  function aoDigitar(valor: string) {
    const novo = mascaraCep(valor)
    setCep(novo)
    if (estado.tipo === 'erro') setEstado({ tipo: 'ocioso' })
    const d = soDigitos(novo)
    if (d.length === 8 && d !== ultimoCep.current)
      void buscarCep(d) // completou o CEP: busca sozinho
    else if (d.length < 8 && estado.tipo === 'buscando' && estado.via === 'cep') {
      pedido.current++ // apagou números no meio da busca: esquece a busca antiga
      ultimoCep.current = ''
      setEstado({ tipo: 'ocioso' })
    }
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault()
    const d = soDigitos(cep)
    if (d.length !== 8) {
      setEstado({ tipo: 'erro', texto: 'Digite os 8 números do CEP.' })
      campoCep.current?.focus()
      return
    }
    void buscarCep(d)
  }

  function limpar() {
    pedido.current++
    ultimoCep.current = ''
    setCep('')
    setOrigem(null)
    setAberta(null)
    setEstado({ tipo: 'ocioso' })
    setAnuncio('')
    campoCep.current?.focus()
  }

  function usarLocalizacao() {
    const n = ++pedido.current
    setEstado({ tipo: 'buscando', via: 'geo' })
    void carregarMapa().catch(() => {})
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (n !== pedido.current) return
        setCep('')
        ultimoCep.current = ''
        mostrarResultado({ lat: p.coords.latitude, lng: p.coords.longitude }, 'Você', null)
      },
      (erro) => {
        if (n !== pedido.current) return
        setEstado({
          tipo: 'erro',
          texto:
            erro.code === erro.PERMISSION_DENIED
              ? 'Você não liberou a localização. Tudo bem: digite o seu CEP.'
              : 'Não conseguimos pegar a sua localização. Digite o seu CEP.',
        })
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    )
  }

  // tocou num marcador do mapa: abre a loja na lista e leva a tela até ela
  const selecionarNoMapa = useCallback((id: number) => {
    setAberta(id)
    const el = cabecas.current.get(id)
    el?.scrollIntoView({ behavior: menosMovimento() ? 'auto' : 'smooth', block: 'nearest' })
    el?.focus({ preventScroll: true })
  }, [])

  const mensagem =
    estado.tipo === 'erro'
      ? estado.texto
      : estado.tipo === 'buscando'
        ? estado.via === 'cep'
          ? `Procurando o CEP ${cep}…`
          : 'Pedindo a sua localização ao aparelho…'
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
            Qual loja fica mais perto de você?
          </h3>
          <p className="mt-1 text-[13.5px] leading-snug font-semibold text-muted-2">
            Digite o seu CEP e veja no mapa as lojas Lalelilo mais próximas.
          </p>
        </div>
      </div>

      <form
        ref={formulario}
        className="mt-3.5 scroll-mt-3"
        onSubmit={aoEnviar}
        noValidate
        role="search"
        aria-label="Buscar a loja mais perto pelo CEP"
      >
        <label htmlFor="cep" className="sr-only">
          Seu CEP
        </label>
        <div
          className={clsx(
            'flex h-14 items-center rounded-[18px] border-[1.5px] bg-white shadow-[0_10px_22px_-16px_rgba(140,45,15,.45)] transition',
            estado.tipo === 'erro'
              ? 'border-[#C0352B] shadow-[0_0_0_4px_rgba(192,53,43,.12)]'
              : 'border-[#EBDCD1] focus-within:border-pink focus-within:shadow-[0_0_0_4px_rgba(236,127,169,.2)]',
          )}
        >
          <MapPin aria-hidden="true" className="ml-3.5 size-5 shrink-0 text-pe" />
          <input
            ref={campoCep}
            id="cep"
            name="cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            enterKeyHint="search"
            maxLength={9}
            placeholder="00000-000"
            value={cep}
            onChange={(e) => aoDigitar(e.target.value)}
            onFocus={() => void carregarMapa().catch(() => {})}
            aria-invalid={estado.tipo === 'erro' || undefined}
            aria-describedby="cep-ajuda cep-msg"
            className="h-full min-w-0 flex-1 bg-transparent pr-1 pl-2 text-lg font-extrabold tracking-[.04em] tabular-nums outline-none placeholder:font-bold placeholder:text-[#9EA3B8]"
          />
          {cep && (
            <button
              type="button"
              onClick={limpar}
              aria-label="Apagar o CEP"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-2 hover:bg-soft"
            >
              <X aria-hidden="true" className="size-[17px]" strokeWidth={2.5} />
            </button>
          )}
          <button
            type="submit"
            disabled={buscando}
            aria-label="Buscar lojas pelo CEP"
            className="mr-1.5 flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-linear-to-br from-pe to-pink-dd px-3.5 text-[15px] font-extrabold text-white shadow-[0_8px_16px_-10px_rgba(168,51,106,.95)] transition duration-150 ease-suave hover:brightness-105 active:scale-[.96] disabled:cursor-progress"
          >
            {buscando && estado.via === 'cep' ? (
              <span className="spin" aria-hidden="true" />
            ) : (
              <>
                <span className="max-[359px]:hidden">Buscar</span>
                <ArrowRight aria-hidden="true" className="size-[17px]" />
              </>
            )}
          </button>
        </div>
        <p
          id="cep-ajuda"
          className="mx-1 mt-2 flex flex-wrap justify-between gap-x-2.5 gap-y-1 text-[12.5px] font-semibold text-muted-2"
        >
          <span>Só os 8 números</span>
          <a
            href="https://buscacepinter.correios.com.br/app/endereco/index.php"
            target="_blank"
            rel="noopener"
            className="font-extrabold text-pink-dd underline-offset-[3px] hover:underline"
          >
            Não sei meu CEP
          </a>
        </p>
      </form>

      <p
        id="cep-msg"
        role="status"
        aria-live="polite"
        className={clsx(
          'mx-1 flex items-start gap-2 text-[13.5px] leading-snug font-bold empty:hidden',
          mensagem && 'mt-2.5',
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

      {temGeo && (
        <>
          <div className="divisor mx-0.5 mt-3 mb-2.5 text-xs font-extrabold tracking-[.08em] text-muted-2 uppercase">
            ou
          </div>
          <button
            type="button"
            onClick={usarLocalizacao}
            disabled={buscando}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#E6D7CC] bg-white text-[15px] font-extrabold text-ink transition duration-150 ease-suave hover:border-[#C9D6EE] hover:bg-[#FDFBFF] active:scale-[.985] disabled:cursor-progress"
          >
            {buscando && estado.via === 'geo' ? (
              <span className="spin spin-azul" aria-hidden="true" />
            ) : (
              <LocateFixed aria-hidden="true" className="size-[19px] text-azul" />
            )}
            Usar a minha localização atual
          </button>
        </>
      )}

      {origem && (
        <div className="mt-4 border-t border-dashed border-[#EBD9CD] pt-3.5">
          <div className="mx-0.5 mb-2.5">
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
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-muted-2 ring-1 ring-[#EFDCCF]">
                {origem.cep ? `CEP ${formatarCep(origem.cep)}` : 'localização do aparelho'}
              </span>
              <button
                type="button"
                onClick={editarCep}
                className="py-1 text-[12.5px] font-extrabold text-pink-dd underline underline-offset-[3px]"
              >
                {origem.cep ? 'Trocar CEP' : 'Usar um CEP'}
              </button>
            </div>
          </div>

          {foraDoRaio && (
            <p className="mb-2.5 flex items-start gap-2.5 rounded-2xl bg-[#EEF3FB] px-[13px] py-3 text-[13.5px] leading-snug font-bold text-[#24406E]">
              <Info aria-hidden="true" className="mt-px size-[18px] shrink-0" />
              <span>
                {longe
                  ? `Ainda não temos loja na sua região. A mais perto fica a ${formatarDistancia(ordem[0].distancia)} — mas você pode falar com qualquer loja pelo WhatsApp.`
                  : `Não há loja num raio de ${RAIO_KM} km. Estas são as mais próximas — a primeira fica a ${formatarDistancia(ordem[0].distancia)}.`}
              </span>
            </p>
          )}

          <div
            ref={caixaMapa}
            className="recorte relative isolate rounded-[20px] border border-[#EADBD0] bg-[#F1ECE6] shadow-[0_12px_26px_-20px_rgba(47,52,80,.55)]"
          >
            <SeOMapaFalhar>
              <Suspense fallback={<div className={clsx('mapa-esqueleto', ALTURA_MAPA)} />}>
                <MapaLojas
                  origem={origem}
                  lojas={marcadores}
                  selecionada={aberta}
                  aoSelecionar={selecionarNoMapa}
                  longe={longe}
                />
              </Suspense>
            </SeOMapaFalhar>
          </div>

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
            Distâncias em linha reta; para ver todas as lojas, use a lista logo abaixo. Seu CEP e sua localização servem
            só para esta busca: não guardamos nada.
          </p>
        </div>
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
