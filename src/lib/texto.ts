/** Sem acento e em minúsculas: "São Lourenço" → "sao lourenco" (para buscar). */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const soDigitos = (s: string) => s.replace(/\D/g, '')

/** Máscara do CEP enquanto digita: "51110160" → "51110-160" (no máximo 8 números). */
export function mascaraCep(valor: string) {
  const d = soDigitos(valor).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export const formatarCep = (cep: string) => mascaraCep(cep)

/** Link utilizável (na lista, "#" quer dizer "ainda não tem"). */
export const linkOk = (url?: string): url is string => !!url && url !== '#'
