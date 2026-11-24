# Lalelilo Kids — Link na Bio

Página do link da bio do Instagram: **https://bio.lalelilo.com.br**

Feita no padrão da empresa (o mesmo do Hub e do RH): **React 19 + Vite + TypeScript + Tailwind 4**, com
ESLint, Prettier e testes com Vitest. Pensada primeiro para o celular e conferida em 320, 360 e 390 px, com o
celular deitado, no tablet e no computador.

## O que tem na página

- **Visual no estilo do hall da intranet** (branch `testes`, em avaliação — ainda não publicado):
  - abertura com o logo redondo, anel nas 4 cores da marca e as 4 estrelinhas em órbita (`OrbitaLogo.tsx`);
  - linha viva que reveza lojas (contador que rola, `Odometro.tsx`), canal novo, vagas e Grupo VIP (`LinhaViva.tsx`);
  - "Tem Lalelilo pertinho de você": as lojas passando em duas faixas; tocar numa abre o localizador nela
    (`FaixaLojas.tsx` → prop `abrir` do `LojaMaisPerto`);
  - seções que entram ao rolar (`lib/movimento.ts`) e "Trabalhe com a gente" num cartão escuro;
  - cores exatas da marca, títulos em Qanelas Soft (Nunito enquanto não houver o arquivo da fonte) e texto em Raleway.
  Tudo para com "reduzir movimento" do aparelho.
- Topo com o logo, redes sociais e o número de lojas.
- **Localizador de lojas** (`src/components/LojaMaisPerto.tsx` + `MapaLojas.tsx`): o mapa aparece já com todas as lojas
  (as que ficam coladas na tela viram uma bolinha com o número; tocar aproxima). Uma busca
  só aceita **CEP, endereço, bairro, cidade ou nome da loja**: enquanto digita, aparecem sugestões (cidades, bairros e
  lojas que temos, sem chamar serviço externo); Enter/Buscar procura o endereço no OpenStreetMap (primeiro em PE, PB e
  AL). Com um ponto de partida (busca ou "Usar minha localização"), o mapa mostra "Você" e a lista traz as lojas mais
  perto (até 20 km, 5 por vez, com "Mostrar menos"). Tocando numa loja: endereço, **Como chegar** (Google Maps),
  **WhatsApp** e **Grupo VIP**. **Limpar busca** (ou o x do campo) volta ao mapa inicial. Nada do que a pessoa busca é
  guardado. Aviso do mapa conforme o jeito de mexer: dedo na tela → dois dedos e pinça; mouse → Ctrl + rolagem.
- "Sua loja": a última loja usada fica guardada só no aparelho da pessoa.
- Canal do YouTube, Instagram/TikTok, vagas (formulários) e LinkedIn.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Lojas (WhatsApp, Grupo VIP, localização, endereço) | `src/data/lojas.ts` — instruções no topo do arquivo |
| Vagas | `src/data/vagas.ts` |
| Cores e fontes da marca | `src/styles/index.css` (bloco `@theme`) |
| Busca do CEP | `src/lib/cep.ts` |
| Sugestões e busca de endereço | `src/lib/busca.ts` |
| Mapa | `src/components/MapaLojas.tsx` |
| Abertura (logo em órbita, linha viva) | `src/components/Topo.tsx`, `OrbitaLogo.tsx`, `LinhaViva.tsx` |
| Faixa de lojas que desliza | `src/components/FaixaLojas.tsx` |

Localização de uma loja nova: no Google Maps, clique com o botão direito em cima da loja e clique nos números
que aparecem (latitude e longitude são copiadas).

## Como o CEP vira um ponto no mapa

Só serviços gratuitos, chamados direto do navegador, nesta ordem:

1. **AwesomeAPI** — já devolve a latitude/longitude da maioria dos CEPs.
2. **ViaCEP** (base dos Correios) — confirma se o CEP existe e dá o endereço.
3. **OpenStreetMap (Nominatim)** — acha a rua desse endereço (ou o centro da cidade).
4. **BrasilAPI** — só se os dois primeiros estiverem fora do ar.

CEP que não existe recebe "Não encontramos o CEP" (o sistema não inventa um lugar). O mapa é o **OpenStreetMap**
(gratuito, sem cadastro), carregado só quando alguém busca. O botão "Como chegar" abre o Google Maps.

## Comandos

```bash
npm install        # uma vez
npm run dev        # site no computador: http://localhost:5180
npm test           # testes
npm run lint       # padrão do código
npm run build      # gera a pasta dist
npm run preview    # mostra a pasta dist: http://localhost:4180
npm run publicar   # confere, compila e publica (branch gh-pages)
```

## Publicação

GitHub Pages do repositório `laleliloltda/lalelilo-bio`, servindo a branch **gh-pages** (gerada pelo
`npm run publicar`). O domínio fica em `public/CNAME` (vai junto na publicação). No Registro.br, zona
lalelilo.com.br: `bio` · tipo **CNAME** · valor **laleliloltda.github.io**.

A versão antiga, em HTML puro, está no histórico do git (antes da migração para React).
