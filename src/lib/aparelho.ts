/** Coisas do aparelho de quem visita: loja preferida (só neste celular) e preferência por menos movimento. */
const CHAVE = 'lalelilo-loja' // mesma chave da versão antiga: quem já tinha uma loja salva continua com ela

export function lerMinhaLoja(): string | null {
  try {
    return localStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

export function salvarMinhaLoja(nome: string | null) {
  try {
    if (nome) localStorage.setItem(CHAVE, nome)
    else localStorage.removeItem(CHAVE)
  } catch {
    /* navegação anônima ou armazenamento bloqueado: só não lembra */
  }
}

export const menosMovimento = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const telaDeToque = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
