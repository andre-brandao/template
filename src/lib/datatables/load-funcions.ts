import type { State } from '@vincjo/datatables/server'

export const myLoadFunction = async (state: State) => {
  console.log(state)

  //   const response = await fetch(
  //     `/users?${getParams(state)}`,
  //   )
  const response = await fetch('/api/datatables/teste').then(res => res.json())
  state.setTotalRows(response.length)
  return response
}

const getParams = ({ offset, rowsPerPage, search, sort, filters }: State) => {
  let params = `offset=${offset}&limit=${rowsPerPage}`
  if (search) params += `&q=${search}`
  if (sort) params += `&sort=${sort.field}&order=${sort.direction}`
  if (filters) {
    params += filters.map(({ field, value }) => `&${field}=${value}`).join()
  }
  return params
}
