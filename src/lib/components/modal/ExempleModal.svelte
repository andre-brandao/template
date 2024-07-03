<script lang="ts">
  import { Modal } from '$lib/components/modal'
  import { modal } from '$lib/components/modal'
  export let props: {
    id: number
    name: string
    email: string
  }

  export let props2: string

  const save = () => {
    modal.close()
    alert('You clicked on "save" button')
  }
</script>

<Modal title="User informations">
  <ul>
    <li>{props.id}</li>
    <li>{props.name}</li>
    <li>{props.email}</li>
  </ul>
  {props2}
  <svelte:fragment slot="footer">
    <button class="btn" on:click={save}>Save</button>
    <button class="btn" on:click={close}>Cancel</button>
  </svelte:fragment>
</Modal>
