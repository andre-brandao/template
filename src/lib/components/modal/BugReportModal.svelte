<script lang="ts">
  import { Modal } from '$lib/components/modal'
  import { modal } from '$lib/components/modal'
  import { icons } from '$lib/utils/icons'
  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { toast } from 'svelte-sonner'
  import { TRPCClientError } from '@trpc/client'

  let bugReport = ''

  async function reportBug() {
    try {
      const resp = await trpc($page).bugReport.reportBug.query({
        text: bugReport,
        metadata: {
          page: $page,
        },
      })
      toast(resp)
    } catch (error) {
      if (error instanceof TRPCClientError) {
        toast.error(error.message)
      }
    }
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

  <div class="mt-4 flex w-full justify-between">
    <a href="/bug_report" class="btn btn-primary" onclick={modal.close}>
      {@html icons.bug()} Ver Bugs Table
    </a>

    <div class="flex gap-3">
      <button class="btn btn-success" onclick={save}>Enviar</button>
      <button class="btn btn-error" onclick={modal.close}>Cancel</button>
    </div>
  </div>
</Modal>

<style>
  main {
    padding: 1rem;
  }
</style>
