<script lang="ts">
  import { Modal } from '$lib/components/modal'
  import { modal } from '$lib/components/modal'
  import { onMount } from 'svelte'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import Loading from '../Loading.svelte'
  import type { SelectSku, InsertSku } from '$db/schema'
  import { toast } from 'svelte-sonner'

  let skus: SelectSku[] = []

  export let newSKU: InsertSku = {
    name: '',
    sku: '',
  }

  export let selectedSKU: (sku: SelectSku) => Promise<void>

  let isLoading = false
  onMount(async () => {
    isLoading = true
    skus = await trpc($page).stock.getSKUs.query()
    isLoading = false
  })

  async function handleAddSKU() {
    if (!newSKU.sku || !newSKU.name) {
      toast.error('Nome e Codigo de Barras são obrigatórios')
      return
    }

    isLoading = true

    try {
      const [resp] = await trpc($page).stock.insertSKU.mutate(newSKU)
      if (resp) {
        await selectedSKU(resp)
        modal.close()
      }
    } catch (error: any) {
      toast.error(error.message)
    }
    isLoading = false
  }

  async function handleSelectSKU(sku: SelectSku) {
    await selectedSKU(sku)
    modal.close()
  }
</script>

<Modal title="Items Estoque">
  {#if isLoading}
    <Loading />
  {:else}
    <div class=" flex gap-3">
      {#each skus as item}
        <button class="btn" onclick={() => handleSelectSKU(item)}>
          {item.name}
        </button>
      {/each}
    </div>

    <div class="card mt-3 flex flex-col space-y-2 bg-base-200 p-1">
      <h2 class="text-center">Adicionar Novo Item</h2>
      <input
        type="text"
        bind:value={newSKU.name}
        placeholder="Nome"
        class="input input-bordered"
      />
      <input
        type="text"
        bind:value={newSKU.sku}
        placeholder="Codigo de Barras"
        class="input input-bordered"
      />
      <button class="btn" onclick={handleAddSKU} disabled={isLoading}>
        Adicionar
      </button>
    </div>
  {/if}
</Modal>
