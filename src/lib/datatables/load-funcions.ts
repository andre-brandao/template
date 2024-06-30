import type { State } from '@vincjo/datatables/server'

export async function myLoadFunction(state: State) {
  console.log(state.sort)

  const response = await fetch(`/api/datatables/user?${getParams(state)}`, {
    method: 'POST',
  }).then(res => res.json())
  const { total, rows } = response

  state.setTotalRows(total)
  return rows
}

const getParams = ({
  offset,
  rowsPerPage,
  search,
  sort,
  filters,
  currentPage,
}: State) => {
  let params = `offset=${offset}&limit=${rowsPerPage}`
  if (search) params += `&q=${search}`
  if (sort) params += `&sort=${sort.field}&order=${sort.direction}`
  if (currentPage) params += `&page=${currentPage}`
  if (filters) {
    params += filters.map(({ field, value }) => `&${field}=${value}`).join()
  }
  return params
}
