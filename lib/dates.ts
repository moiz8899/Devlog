import { formatDistanceToNow, format } from 'date-fns'

export const timeAgo = (date: Date | string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const formatDate = (date: Date | string, formatStr: string = 'MMM d, yyyy') => {
  return format(new Date(date), formatStr)
}

export const formatMonthYear = (dateStr: string) => {
  const [year, month] = dateStr.split('-')
  return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy')
}