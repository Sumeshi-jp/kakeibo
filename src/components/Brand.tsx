const ICON = `${import.meta.env.BASE_URL}icons/pwa-192x192.png`

interface BrandProps {
  size?: 'sm' | 'lg'
  as?: 'h1' | 'span'
}

/** アプリアイコン（K）と、セリフ体の「kakeibo」 */
export function Brand({ size = 'sm', as: Tag = 'span' }: BrandProps) {
  const lg = size === 'lg'
  return (
    <Tag className="flex items-center gap-3">
      <img
        src={ICON}
        alt=""
        width={lg ? 56 : 32}
        height={lg ? 56 : 32}
        className={`${lg ? 'size-14 rounded-2xl' : 'size-8 rounded-lg'} shadow-[var(--shadow-card)]`}
      />
      <span className={`font-brand font-semibold italic tracking-wide ${lg ? 'text-4xl' : 'text-2xl'}`}>kakeibo</span>
    </Tag>
  )
}
