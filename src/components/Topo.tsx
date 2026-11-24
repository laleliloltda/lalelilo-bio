import { Brilho, Instagram, TikTok, YouTube } from './icones'
import { LinhaViva } from './LinhaViva'
import { OrbitaLogo } from './OrbitaLogo'

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

/** Abertura: o logo em órbita, a frase da marca, a linha viva (lojas, canal, vagas e VIP) e as redes. */
export function Topo() {
  return (
    <header className="relative pt-1 text-center">
      <OrbitaLogo />
      <h1 className="reveal mx-auto max-w-[340px] font-display text-[23px] leading-[1.22] font-extrabold tracking-[-.015em] [animation-delay:.05s] max-[360px]:text-[20px]">
        A rede de moda infantil que{' '}
        <em className="tagline-em">
          mais cresce
          <Brilho className="absolute -top-2 -right-[9px] size-3.5 text-pink-d [animation:twinkle_2.4s_ease-in-out_infinite_.8s]" />
        </em>{' '}
        no Brasil
      </h1>
      <LinhaViva />
      <nav className="reveal mt-4 flex justify-center gap-2.5 [animation-delay:.15s]" aria-label="Redes sociais">
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
