export type TableState = {
  currentPage: number
  rowsPerPage: number
  search: string | undefined
  sort?: {
    field: string
    direction: 'asc' | 'desc' | string
  }

  filters?: Record<string, string>

  totalRows: number

  isLoading?: boolean
}

export const getParams = ({
  rowsPerPage,
  search,
  sort,
  // filters,
  currentPage,
}: TableState) => {
  let params = `limit=${rowsPerPage}`
  if (currentPage) params += `&page=${currentPage}`
  if (search) params += `&q=${search}`
  if (sort) params += `&sort=${sort.field}&order=${sort.direction}`
  // if (filters) {
  //   params += filters.map(({ field, value }) => `&${field}=${value}`).join()
  // }
  return params
}
