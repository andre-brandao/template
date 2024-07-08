<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  import { getUserContext } from '$lib/stores/user'
  const user = getUserContext()
  const { bugs } = data
  import { toast } from 'svelte-sonner'

  import Board from '$lib/components/dnd/DnDBoard.svelte'
  import type { SelectBugReport } from '$db/schema'

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { TRPCClientError } from '@trpc/client'

  let columnsData = [
    {
      id: 'c1',
      label: 'TODO',
      items: bugs.filter(bug => bug.status === 'TODO'),
    },
    {
      id: 'c2',
      label: 'IN_PROGRESS',
      items: bugs.filter(bug => bug.status === 'IN_PROGRESS'),
    },
    {
      id: 'c3',
      label: 'DONE',
      items: bugs.filter(bug => bug.status === 'DONE'),
    },
  ]
  async function handleBoardUpdated(newColumnsData: typeof columnsData) {
    if (!$user?.permissions.isAdmin) {
      return toast.error(
        'Você não tem permissão para alterar o status dos bugs',
      )
    }
    columnsData = newColumnsData
    for (const col of newColumnsData) {
      for (const row of col.items) {
        if (col.label !== row.status) {
          try {
            const resp = await trpc().updateBugStatus.query({
              id: row.id,
              // @ts-ignore
              status: col.label,
            })
            toast(resp)
          } catch (err) {
            if (err instanceof TRPCClientError) {
              toast.error(err.message)
            } else {
              toast.error('Erro ao atualizar o status do bug')
            }
          }
        }
      }
    }
  }
</script>

<Board
  columns={columnsData}
  onFinalUpdate={handleBoardUpdated}
  disabled={{
    card: !$user?.permissions.isAdmin,
    column: !$user?.permissions.isAdmin,
  }}
>
  {#snippet card(bug)}
    <div
      class=" m-2 w-full rounded-lg p-3 shadow-md"
      class:todo={bug.status === 'TODO'}
      class:inprogress={bug.status === 'IN_PROGRESS'}
      class:done={bug.status === 'DONE'}
    >
      <div class="m-2 rounded-lg bg-white p-3 shadow-md dark:bg-gray-800">
        <h3 class="text-xl font-semibold">{bug.text}</h3>

        <hr class="my-2" />

        <p class="text-gray-600 dark:text-gray-400">
          Reportado: {bug.created_by_name}
        </p>

        <div class="mt-2">
          Pagina do bug:
          {bug.page_data}
        </div>
      </div>
    </div>
  {/snippet}
</Board>

<style>
  .todo {
    background-color: #f8d7da;
  }

  .inprogress {
    background-color: #fff3cd;
  }

  .done {
    background-color: #d4edda;
  }
</style>
