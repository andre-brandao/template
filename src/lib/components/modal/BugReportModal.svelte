<script lang="ts">
  import { Modal } from '$lib/components/modal'
  import { modal } from '$lib/components/modal'
  import { icons } from '$lib/utils/icons'
  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { toast } from 'svelte-sonner'

  let bugReport = ''

  async function reportBug() {
    const resp = await trpc($page).reportBug.query({
      text: bugReport,
      page_data: JSON.stringify($page.url),
    })

    toast(resp)
  }

  const save = () => {
    modal.close()
    reportBug()
  }
</script>

<Modal title="Central de correção de bugs">
  <main class="flex flex-col items-center space-y-4">
    <p>Descreva o problema encontrado e informe o que você estava fazendo</p>

    <textarea
      class="textarea textarea-info"
      bind:value={bugReport}
      placeholder="Ao clicar em 'Enviar', você estará reportando um bug para nossa equipe de desenvolvimento."
      id="bugReport"
      rows="4"
      cols="50"
    ></textarea>
  </main>

  <svelte:fragment slot="footer">
    <div class="flex w-full justify-between">
      <a href="/bug_report" class="btn btn-primary">
        {@html icons.bug()} Ver Bugs Table
      </a>

      <div class="flex">
        <button class="btn btn-success" on:click={save}>Enviar</button>
        <button class="btn btn-error" on:click={modal.close}>Cancel</button>
      </div>
    </div>
  </svelte:fragment>
</Modal>

<style>
  main {
    padding: 1rem;
  }
</style>
