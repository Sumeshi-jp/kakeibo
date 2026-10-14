import { addMonths, format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

/** 'YYYY-MM-DD' → '10月14日（火）' */
export const dayHeading = (date: string) => format(parseISO(date), 'M月d日（E）', { locale: ja })

/** 'YYYY-MM' → '2026年10月' */
export const monthHeading = (month: string) => format(parseISO(`${month}-01`), 'yyyy年M月')

/** 'YYYY-MM' を n か月ずらす */
export const shiftMonth = (month: string, n: number) => format(addMonths(parseISO(`${month}-01`), n), 'yyyy-MM')

export const todayString = () => format(new Date(), 'yyyy-MM-dd')
export const thisMonth = () => format(new Date(), 'yyyy-MM')
