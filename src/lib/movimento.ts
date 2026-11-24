/** Movimento com propósito (o mesmo do hall da intranet): entrada quando a seção aparece na tela e respeito ao
 *  "reduzir movimento" do aparelho. */
import { type RefObject, useEffect, useRef, useState } from 'react'

export function menosMovimentoAgora(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** true enquanto o aparelho pede "reduzir movimento" (acompanha se a pessoa mudar a configuração). */
export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(menosMovimentoAgora)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const mudou = () => setReduzir(mq.matches)
    mq.addEventListener?.('change', mudou)
    return () => mq.removeEventListener?.('change', mudou)
  }, [])
  return reduzir
}

/** Fica true (e não volta mais) quando o elemento entra na tela. */
export function useApareceu<T extends Element>(margem = '0px 0px -8% 0px'): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [visto, setVisto] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || visto) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisto(true)
      return
    }
    const obs = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setVisto(true)
          obs.disconnect()
        }
      },
      { rootMargin: margem },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [margem, visto])
  return [ref, visto]
}
