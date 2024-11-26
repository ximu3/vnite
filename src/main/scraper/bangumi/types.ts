export interface BangumiSubject {
  id: number
  type: number
  name: string
  name_cn: string
  summary: string
  air_date: string
  date: string
  images: {
    large: string
    common: string
    medium: string
    small: string
    grid: string
  }
  staff: Array<{
    name: string
    role: string
  }>
  tags: Array<{
    name: string
    count: number
  }>
  url: string
  infobox: [
    {
      key: string
      value: string
    }
  ]
}

export interface BangumiSearchResult {
  list: Array<{
    id: number
    name: string
    name_cn: string
    air_date?: string
    staff?: Array<{
      name: string
      role: string
    }>
  }>
}
