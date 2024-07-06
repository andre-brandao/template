export type TableState = {
  currentPage: number
  rowsPerPage: number
  offset: number
  search: string | undefined
  sort:
    | {
        field: string
        direction: 'asc' | 'desc' | string
      }
    | undefined
  filters:
    | {
        field: string
        value: string
      }[]
    | undefined
  totalRows: number
}
