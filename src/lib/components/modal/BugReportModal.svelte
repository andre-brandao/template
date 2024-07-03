<script lang="ts">
  import { Modal } from '$lib/components/modal'
  import { modal } from '$lib/components/modal'

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'

  let bugReport = ''

  async function reportBug() {
    const resp = await trpc($page).reportBug.query({ text: bugReport })

    console.log(resp)
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
    <button class="btn bg-primary" on:click={save}>Enviar</button>
    <button class="btn bg-red-400" on:click={modal.close}>Cancel</button>
  </svelte:fragment>
</Modal>

<style>
  main {
    padding: 1rem;
  }
</style>
