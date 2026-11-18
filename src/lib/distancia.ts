export interface Ponto {
  lat: number
  lng: number
}

/** Distância em linha reta, em km (fórmula de Haversine). */
export function km(a: Ponto, b: Ponto) {
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

const metros = (d: number) => Math.max(50, Math.round((d * 1000) / 50) * 50)

/** "650 m", "2,3 km", "23 km", "1.234 km". */
export function formatarDistancia(d: number) {
  if (d < 1) return `${metros(d)} m`
  if (d < 10) return `${d.toFixed(1).replace('.', ',')} km`
  return `${Math.round(d).toLocaleString('pt-BR')} km`
}

/** Para leitores de tela: "650 metros", "2,3 quilômetros". */
export function distanciaFalada(d: number) {
  return d < 1 ? `${metros(d)} metros` : formatarDistancia(d).replace('km', 'quilômetros')
}

/** Itens do mais perto para o mais longe, com a distância de cada um. */
export function ordenarPorDistancia<T extends Ponto>(origem: Ponto, itens: T[]) {
  return itens.map((item) => ({ item, distancia: km(origem, item) })).sort((a, b) => a.distancia - b.distancia)
}
