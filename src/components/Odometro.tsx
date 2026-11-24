/** Número que rola dígito a dígito até o valor, como um contador (cada dígito é uma fita de 0 a 9) — o mesmo do hall
 *  da intranet. Com "reduzir movimento", o número aparece direto. */
import clsx from 'clsx'

export function Odometro({ texto, ativo, className }: { texto: string; ativo: boolean; className?: string }) {
  const chars = [...texto]
  return (
    <span className={clsx('odometro', className)}>
      <span className="sr-only">{texto}</span>
      <span className="odo-visual" aria-hidden="true">
        {chars.map((ch, i) => {
          const chave = chars.length - i // da direita: os dígitos não "pulam" quando o número ganha uma casa
          if (!/\d/.test(ch))
            return (
              <span key={`s${chave}`} className="odo-sep">
                {ch}
              </span>
            )
          return (
            <span key={`d${chave}`} className="odo-col">
              <span
                className="odo-fita"
                style={{
                  transform: `translateY(${ativo ? -Number(ch) * 10 : 0}%)`,
                  transitionDelay: `${(chars.length - i) * 70}ms`,
                }}
              >
                {'0123456789'.split('').map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
