import type { Loja } from '@/data/lojas'

/** "Pina, Recife": o que vem depois do último " - " do endereço. */
export const bairroCidade = (l: Loja) => l.endereco.split(' - ').pop() ?? ''

/** "Como chegar" no Google Maps (abre o app no celular, com a rota a partir de onde a pessoa está).
 *  Nos shoppings vai o nome do shopping junto, para o Google achar o lugar certo. */
export function rotaGoogleMaps(l: Loja) {
  const shopping = /^(Shopping|Recife Outlet)/.test(l.nome) ? `${l.nome.replace(/\s*\(.*\)$/, '')}, ` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${shopping}${l.endereco}, ${l.uf}`)}`
}
