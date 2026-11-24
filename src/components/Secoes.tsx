/** Seções de baixo: canal do YouTube, redes sociais, vagas e rodapé. */
import {
  ArrowUpRight,
  Briefcase,
  Car,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Hammer,
  Heart,
  PaintRoller,
  Palette,
  ShoppingBag,
  Store,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'

import { VAGAS, type IconeVaga } from '@/data/vagas'
import { useApareceu } from '@/lib/movimento'

import { Instagram, LinkedIn, Play, TikTok } from './icones'
import { Odometro } from './Odometro'

const ICONES_VAGA: Record<IconeVaga, LucideIcon> = {
  'shopping-bag': ShoppingBag,
  'graduation-cap': GraduationCap,
  users: Users,
  briefcase: Briefcase,
  car: Car,
  wrench: Wrench,
  palette: Palette,
  'clipboard-list': ClipboardList,
  'paint-roller': PaintRoller,
  hammer: Hammer,
  store: Store,
}

export function Youtube() {
  const [ref, visto] = useApareceu<HTMLAnchorElement>()
  return (
    <a
      id="canal"
      ref={ref}
      className={clsx(
        'surge relative mt-[18px] block scroll-mt-4 overflow-hidden rounded-card no-underline shadow-card hover:-translate-y-0.5',
        visto && 'is-visivel',
      )}
      href="https://www.youtube.com/@lalelilokids"
      target="_blank"
      rel="noopener"
    >
      <img
        src="/youtube-aventuras.jpg"
        alt="Lalelilo Aventuras Bíblicas — novo canal no YouTube"
        loading="lazy"
        className="block aspect-video w-full object-cover"
      />
      <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-[5px] text-xs font-extrabold text-ink shadow-[0_4px_12px_rgba(0,0,0,.15)]">
        <i className="ao-vivo size-[7px] rounded-full bg-[#FF2D2D]" />
        Novo canal
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2.5 bg-linear-to-t from-[rgba(20,18,30,.82)] to-[rgba(20,18,30,0)] px-4 pt-10 pb-3.5 text-white">
        <strong className="font-display text-[17px] leading-tight font-extrabold">
          Lalelilo Aventuras Bíblicas
          <small className="block font-sans text-[12.5px] font-semibold opacity-85">
            Assista com as crianças no YouTube
          </small>
        </strong>
        <span className="grid size-[46px] shrink-0 place-items-center rounded-full bg-[#FF0000]">
          <Play className="ml-[3px] size-[18px]" />
        </span>
      </span>
    </a>
  )
}

export function Siga() {
  const redes = [
    {
      nome: 'Instagram',
      url: 'https://www.instagram.com/lalelilokids/',
      Icone: Instagram,
      fundo: 'bg-linear-45 from-[#F9A13A] via-[#E5484D] to-[#B23AA8]',
    },
    {
      nome: 'TikTok',
      url: 'https://www.tiktok.com/@lalelilokids?_r=1&_t=ZS-953EuaYUS3u',
      Icone: TikTok,
      fundo: 'bg-[#111]',
    },
  ]
  const [ref, visto] = useApareceu<HTMLDivElement>()
  return (
    <div ref={ref} className={clsx('surge mt-[18px] grid grid-cols-2 gap-2.5', visto && 'is-visivel')}>
      {redes.map(({ nome, url, Icone, fundo }) => (
        <a
          key={nome}
          href={url}
          target="_blank"
          rel="noopener"
          className="flex min-w-0 items-center gap-2.5 rounded-[18px] bg-card p-3.5 no-underline shadow-card transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span className={`grid size-[38px] shrink-0 place-items-center rounded-xl text-white ${fundo}`}>
            <Icone className="size-[19px]" />
          </span>
          <span className="min-w-0">
            <b className="block text-[14.5px] font-extrabold">{nome}</b>
            <small className="block truncate text-xs font-semibold text-muted">@lalelilokids</small>
          </span>
        </a>
      ))}
    </div>
  )
}

/** "Trabalhe com a gente" no escuro, como a faixa ao vivo do hall: o número de vagas rola quando o cartão aparece. */
export function Vagas() {
  const [ref, visto] = useApareceu<HTMLElement>()
  return (
    <section
      id="vagas"
      ref={ref}
      className={clsx('surge vagas-escuro mt-7 scroll-mt-4 rounded-card p-5', visto && 'is-visivel')}
      aria-labelledby="t-vagas"
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[.08em] text-[#ffb1cf] uppercase">
        <Briefcase aria-hidden="true" className="size-3.5" /> Trabalhe com a gente
      </span>
      <h3 id="t-vagas" className="mt-2 font-display text-[24px] leading-[1.12] font-extrabold tracking-[-.015em]">
        Quer crescer junto com a Lalelilo?
      </h3>
      <p className="mt-3 flex items-baseline gap-2.5">
        <Odometro
          texto={String(VAGAS.length)}
          ativo={visto}
          className="font-display text-[46px] leading-none font-extrabold"
        />
        <span className="text-[15px] font-bold text-white/75">vagas abertas</span>
      </p>
      <details className="group mt-4">
        <summary className="flex h-12 list-none items-center justify-between rounded-[14px] border border-white/15 bg-white/[.07] px-4 text-sm font-extrabold text-white transition-colors hover:bg-white/[.12] [&::-webkit-details-marker]:hidden">
          Ver as vagas e se candidatar
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-white/60 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <ul className="mt-2 grid gap-1.5">
          {VAGAS.map((v) => {
            const Icone = ICONES_VAGA[v.icone]
            return (
              <li key={v.nome}>
                <a
                  href={v.link}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[.05] py-2 pr-3 pl-2 text-sm font-bold text-white no-underline transition duration-200 hover:translate-x-0.5 hover:border-white/30 hover:bg-white/[.09]"
                >
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-white/10 text-[#cfdaeb]">
                    <Icone aria-hidden="true" className="size-[17px]" />
                  </span>
                  {v.nome}
                  <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-white/45" />
                </a>
              </li>
            )
          })}
        </ul>
      </details>
      <a
        href="https://www.linkedin.com/company/lalelilo"
        target="_blank"
        rel="noopener"
        className="mt-2.5 flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-extrabold text-[#9cc8ff] no-underline hover:bg-white/[.08]"
      >
        <LinkedIn className="size-[17px]" />
        Lalelilo no LinkedIn
      </a>
    </section>
  )
}

export function Rodape() {
  const [ref, visto] = useApareceu<HTMLElement>()
  return (
    <footer
      ref={ref}
      className={clsx(
        'surge mt-[26px] flex items-center justify-center gap-[5px] text-[12.5px] font-bold',
        visto && 'is-visivel',
      )}
    >
      Feito com <Heart role="img" aria-label="amor" className="bate size-3 fill-white text-white" /> pela Lalelilo Kids
    </footer>
  )
}
