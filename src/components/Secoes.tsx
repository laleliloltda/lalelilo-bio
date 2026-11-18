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

import { VAGAS, type IconeVaga } from '@/data/vagas'

import { Instagram, LinkedIn, Play, TikTok } from './icones'

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
  return (
    <a
      className="reveal relative mt-[18px] block overflow-hidden rounded-card no-underline shadow-card transition-transform duration-300 [animation-delay:.15s] hover:-translate-y-0.5"
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
        <strong className="font-display text-[17px] leading-tight font-semibold">
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
  return (
    <div className="reveal mt-[18px] grid grid-cols-2 gap-2.5 [animation-delay:.25s]">
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

export function Vagas() {
  return (
    <section
      className="reveal mt-7 rounded-card border border-white/70 bg-white/92 p-[18px] shadow-card [animation-delay:.35s]"
      aria-labelledby="t-vagas"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#EEF1F7] text-[#5D7196]">
          <Briefcase aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h3 id="t-vagas" className="font-display text-lg leading-tight font-semibold">
            Trabalhe com a gente
          </h3>
          <p className="mt-0.5 text-[13.5px] leading-snug text-muted">
            Quer crescer junto com a Lalelilo? Escolha a vaga e preencha o formulário.
          </p>
        </div>
      </div>
      <details className="group mt-3.5">
        <summary className="flex h-[46px] list-none items-center justify-between rounded-[14px] border-[1.5px] border-line bg-white px-3.5 text-sm font-extrabold [&::-webkit-details-marker]:hidden">
          Ver as {VAGAS.length} vagas abertas
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted transition-transform duration-200 group-open:rotate-180"
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
                  className="flex items-center gap-3 rounded-[14px] border border-[#F3EEE8] bg-white py-2 pr-3 pl-2 text-sm font-bold no-underline transition duration-200 hover:translate-x-0.5 hover:border-[#C9D3E3]"
                >
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-[#EEF1F7] text-[#5D7196]">
                    <Icone aria-hidden="true" className="size-[17px]" />
                  </span>
                  {v.nome}
                  <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-[#B5B8C9]" />
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
        className="mt-2.5 flex h-11 items-center justify-center gap-2 rounded-[14px] text-sm font-extrabold text-[#0A66C2] no-underline hover:bg-[#EEF4FB]"
      >
        <LinkedIn className="size-[17px]" />
        Lalelilo no LinkedIn
      </a>
    </section>
  )
}

export function Rodape() {
  return (
    <footer className="reveal mt-[26px] flex items-center justify-center gap-[5px] text-[12.5px] font-bold [animation-delay:.45s]">
      Feito com <Heart role="img" aria-label="amor" className="bate size-3 fill-white text-white" /> pela Lalelilo Kids
    </footer>
  )
}
