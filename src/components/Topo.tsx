import { LOJAS } from '@/data/lojas'

import { Brilho, Instagram, TikTok, YouTube } from './icones'

// brilhos ao redor do logo: posição, tamanho, atraso e duração da piscada
const BRILHOS = [
  { pos: 'top-6 left-[18%] size-[18px]', atraso: '0s', duracao: '3.2s' },
  { pos: 'top-24 right-[19%] size-3', atraso: '1.1s', duracao: '3.2s' },
  { pos: 'top-2 right-[28%] size-2.5', atraso: '2s', duracao: '3.2s' },
  { pos: 'top-[74px] left-[26%] size-[13px]', atraso: '.5s', duracao: '2.6s' },
  { pos: 'top-[138px] left-[28%] size-2', atraso: '1.6s', duracao: '3.8s' },
  { pos: 'top-[52px] right-[13%] size-[15px]', atraso: '2.6s', duracao: '4s' },
]

const REDES = [
  { nome: 'Instagram', url: 'https://www.instagram.com/lalelilokids/', Icone: Instagram, cor: 'text-[#D6336C]' },
  {
    nome: 'TikTok',
    url: 'https://www.tiktok.com/@lalelilokids?_r=1&_t=ZS-953EuaYUS3u',
    Icone: TikTok,
    cor: 'text-[#111]',
  },
  { nome: 'YouTube', url: 'https://www.youtube.com/@lalelilokids', Icone: YouTube, cor: 'text-[#FF0000]' },
]

export function Topo() {
  return (
    <header className="relative pt-1.5 text-center">
      {BRILHOS.map((b) => (
        <Brilho
          key={b.pos}
          className={`spark ${b.pos}`}
          style={{ animationDelay: b.atraso, animationDuration: b.duracao }}
        />
      ))}
      {/* logo num círculo branco, com um anel de luz em volta */}
      <span className="reveal mx-auto mb-[18px] grid size-[150px] place-items-center overflow-hidden rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,.35),0_18px_40px_-16px_rgba(60,40,90,.5)]">
        <img className="block h-[116px] w-auto" src="/logo-lalelilo.jpg" alt="Lalelilo Kids" height={116} />
      </span>
      <p className="reveal mx-auto max-w-[330px] font-display text-[21px] leading-[1.25] font-semibold tracking-[-.01em] max-[360px]:text-[19px]">
        A rede de moda infantil que{' '}
        <em className="tagline-em">
          mais cresce
          <Brilho className="absolute -top-2 -right-[9px] size-3.5 text-pink-d [animation:twinkle_2.4s_ease-in-out_infinite_.8s]" />
        </em>{' '}
        no Brasil
      </p>
      <p className="reveal mt-3 inline-flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-white/60 bg-white/40 px-[15px] py-[7px] text-[13.5px] font-bold backdrop-blur-md">
        <span>
          <b className="font-extrabold">{LOJAS.length}</b> lojas
        </span>
        <Brilho className="size-[9px] text-pink-d" />
        <span>Pernambuco · Paraíba · Alagoas</span>
      </p>
      <nav className="reveal mt-4 flex justify-center gap-2.5" aria-label="Redes sociais">
        {REDES.map(({ nome, url, Icone, cor }) => (
          <a
            key={nome}
            href={url}
            target="_blank"
            rel="noopener"
            aria-label={nome}
            className={`grid size-11 place-items-center rounded-full bg-card shadow-card transition-transform duration-200 hover:-translate-y-0.5 ${cor}`}
          >
            <Icone className="size-[19px]" />
          </a>
        ))}
      </nav>
    </header>
  )
}
