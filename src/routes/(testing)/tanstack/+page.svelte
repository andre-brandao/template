<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'

  import { modal, FormModal } from '$lib/components/modal'

  import SuperSelect from '$lib/components/input/Select.svelte'
  import {
    renderComponent,
    type ColumnDef,
    type TableOptions,
  } from '@tanstack/svelte-table'
  import Datatable from '$components/table/Datatable.svelte'
  import {
    type TableState,
    getParams,
    EditRowButton,
    EditRowInput,
  } from '$lib/components/table'
  import type { RouterOutputs, RouterInputs } from '$trpc/router'

  type Products = RouterOutputs['product']['paginatedProducts']['rows'][0]

  const defaultColumns: ColumnDef<Products>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: info =>
        renderComponent(EditRowInput<Products>, {
          id: info.row.original.id,
          colID: 'name',
          editT: 'text',
          value: info.getValue(),
        }),
      footer: info => info.column.id,
    },
    {
      // accessorFn: row => row.description,
      header: () => 'Description',
      accessorKey: 'description',
      cell: info =>
        renderComponent(EditRowInput<Products>, {
          id: info.row.original.id,
          colID: 'description',
          editT: 'text',
          value: info.getValue(),
        }),
      footer: info => info.column.id,
    },

    {
      id: 'edit',
      header: () => 'Edit',
      cell: info =>
        renderComponent(EditRowButton<Products>, {
          row: info.row.original,
        }),
      // footer: info => info.column.id,
    },
  ]

  async function load(s: TableState) {
    const resp = await trpc($page).product.paginatedProducts.query(s)

    return {
      data: resp.rows ?? [],
      count: resp.total ?? 0,
    }
  }

  async function save(changes: { [key: string]: Products }) {
    for (const key in changes) {
      try {
        const resp = await trpc($page).product.updateProduct.mutate({
          id: Number(key),
          prod: {
            name: changes[key].name,
            description: changes[key].description,
          },
        })

        if (resp) {
          toast.success(`#${key} 'Product updated'`)
        }
      } catch (error) {
        toast.error(`#${key} 'Product update failed'`)
      }
    }
    return {
      success: true,
    }
  }
  function add(invalidate: Function) {
    modal.open(FormModal<RouterInputs['product']['insertProduct']>, {
      title: 'Add Product',

      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
          validate: (value: string) => {
            if (!value || value.length < 3) {
              return {
                valid: false,
                message: 'Name must be at least 3 characters',
              }
            }
            return { valid: true, message: '' }
          },
        },
        {
          label: 'Description',
          name: 'description',
          type: 'textarea',
          required: true,
          annotation: 'Product description',
        },
        {
          label: 'Essa é a checkbox',
          name: 'created_at',
          type: 'checkbox',
        },
        {
          label: 'Select ID',
          name: 'id',
          type: 'component',
          component: {
            ref: SuperSelect,
            props: {
              options: [
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 5, label: 'Cinco' },
              ],
              add: (v: string) => Promise.resolve({ value: v, label: v }),
            },
          },
        },
      ],
      save: async toSave => {
        console.log(toSave)
        toast(JSON.stringify(toSave))
        try {
          const resp = await trpc($page).product.insertProduct.mutate(toSave)

          if (resp) {
            toast.success('Product created')
            invalidate()
          }
        } catch (error) {
          toast.error('Product creation failed')
          return 'Product creation failed'
        }
      },
    })
  }
</script>

<div class="container mx-auto h-[70vh] overflow-x-auto border p-2">
  <Datatable columns={defaultColumns} {load} {save} {add} />
</div>
