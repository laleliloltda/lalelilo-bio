import { Lojas } from './components/Lojas'
import { Rodape, Siga, Vagas, Youtube } from './components/Secoes'
import { Topo } from './components/Topo'

/** Link da bio do Instagram da Lalelilo Kids (bio.lalelilo.com.br). Coluna única, pensada primeiro para o celular. */
export default function App() {
  return (
    <>
      {/* fundo animado: gradiente laranja → rosa com luzes suaves */}
      <div className="bg" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <main className="mx-auto max-w-[480px] pt-7 pr-[max(16px,env(safe-area-inset-right))] pb-[max(40px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))] max-[360px]:pr-[max(12px,env(safe-area-inset-right))] max-[360px]:pl-[max(12px,env(safe-area-inset-left))]">
        <Topo />
        <Lojas />
        <Youtube />
        <Siga />
        <Vagas />
        <Rodape />
      </main>
    </>
  )
}
