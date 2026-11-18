# Lalelilo Kids — Link na Bio

Página do link da bio do Instagram: **https://bio.lalelilo.com.br**

Feita no padrão da empresa (o mesmo do Hub e do RH): **React 19 + Vite + TypeScript + Tailwind 4**, com
ESLint, Prettier e testes com Vitest. Pensada primeiro para o celular e conferida em 320, 360 e 390 px, com o
celular deitado, no tablet e no computador.

## O que tem na página

- Topo com o logo, redes sociais e o número de lojas.
- **Qual loja fica mais perto de você?** A pessoa digita o CEP (a busca começa sozinha ao completar os 8
  números) ou toca em "Usar a minha localização". Aparecem um mapa com ela e as lojas mais próximas, e a lista
  da mais perto para a mais longe, com a distância em linha reta. Ao tocar numa loja: endereço, **Como chegar**
  (abre o Google Maps com a rota), **WhatsApp** e **Grupo VIP**. O CEP e a localização não são guardados.
- Lista completa **por região** (Recife e Região Metropolitana, Zona da Mata, Agreste, Sertão, Paraíba e Alagoas):
  seis linhas curtas com o número de lojas e as cidades; abre uma região por vez, com as lojas numa grade de duas
  colunas, e o detalhe da loja (endereço, Como chegar, WhatsApp e Grupo VIP) aparece logo abaixo dela. Região com
  mais de 8 lojas (hoje, a de Recife) ganha botões por cidade. A busca por nome, bairro ou cidade procura em todas.
- "Sua loja": a última loja usada fica guardada só no aparelho da pessoa.
- Canal do YouTube, Instagram/TikTok, vagas (formulários) e LinkedIn.

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Lojas (WhatsApp, Grupo VIP, localização, endereço) | `src/data/lojas.ts` — instruções no topo do arquivo |
| Regiões da lista (cidade → região) | `src/data/regioes.ts` — o teste avisa se uma loja nova cair fora |
| Vagas | `src/data/vagas.ts` |
| Cores e fontes da marca | `src/styles/index.css` (bloco `@theme`) |
| Busca do CEP | `src/lib/cep.ts` |
| Mapa | `src/components/MapaLojas.tsx` |

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
