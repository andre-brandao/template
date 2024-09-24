<script lang="ts">
  import { createRender, type DataLabel } from 'svelte-headless-table'
  import type { PageData } from './$types'
  export let data: PageData

  import Table from '$components/table/Table.svelte'
  import SelectIndicator from '$components/table/edit/SelectIndicator.svelte'
  import EditableCell from '$components/table/edit/EditableCell.svelte'
  import { writable } from 'svelte/store'
  import TextFilter from '$components/table/filters/TextFilter.svelte'

  const { rows } = data

  type Row = (typeof rows)[0]
  const tableRows = writable(rows)
  

  const EditableCellLabel: DataLabel<Row> = ({ column, row, value }) =>
    createRender(EditableCell, {
      row,
      column,
      value,
      onUpdateValue: (
        rowDataId: string,
        columnId: string,
        newValue: unknown,
      ) => {
        console.log(rowDataId, columnId, newValue)
        if (['age', 'visits', 'progress'].includes(columnId)) {
          // @ts-expect-error
          newValue = parseInt(newValue)
          // @ts-expect-error
          if (isNaN(newValue)) {
            // Refresh data to reset invalid values.
            $tableRows = $tableRows
            return
          }
        }
        if (columnId === 'status') {
          // @ts-expect-error
          if (!['relationship', 'single', 'complicated'].includes(newValue)) {
            // Refresh data to reset invalid values.
            $tableRows = $tableRows
            return
          }
        }
        // In this case, the dataId of each item is its index in $tableRows.
        // You can also handle any server-synchronization necessary here.
        const idx = parseInt(rowDataId)
        const currentItem = $tableRows[idx]
        const key = columnId // Cast as `keyof YourDataItem`
        const newItem = { ...currentItem, [key]: newValue }
        console.log(newItem)
        $tableRows[idx] = newItem
        $tableRows = $tableRows
        // Handle any server-synchronization.
      },
    })
</script>

<Table
  data={tableRows}
  createColumns={table => [
    table.display({
      id: 'selected',
      header: '',
      cell: ({ row, column }, { pluginStates }) => {
        const { isSomeSubRowsSelected, isSelected } =
          pluginStates.select.getRowState(row)
        return createRender(SelectIndicator, {
          isSelected,
          isSomeSubRowsSelected,
        })
      },
    }),
    table.column({
      header: 'ID',
      accessor: 'id',
      cell: EditableCellLabel,
    }),
    table.column({
      header: 'Name',
      accessor: 'name',
      cell: EditableCellLabel,
      plugins: {
        sort: {
          invert: true,
          // disable: true,
          
        },
        filter: {
          fn: ({ filterValue, value }) => {
            return String(value)
              .toLowerCase()
              .startsWith(String(filterValue).toLowerCase())
          },
          initialFilterValue: '',
          render: ({ filterValue, values, preFilteredValues }) =>
            createRender(TextFilter, {
              filterValue,
              values,
              preFilteredValues,
            }),
        },
      },
    }),
    table.column({
      header: 'Age',
      accessor: 'email',
      // cell: EditableCell
      cell: EditableCellLabel,
    }),
    table.column({
      header: 'Verified',
      accessor: 'verified',
      // cell: EditableCell
      cell: EditableCellLabel,
    }),
  ]}
/>
