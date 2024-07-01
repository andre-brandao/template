<script lang="ts">
  import { Modal } from '$lib/components/modal'
  export let close: () => void
  export let props: {
    id: number
    name: string
    email: string
  }

  const user = props

  const save = () => {
    close()
    alert('You clicked on "save" button')
  }
</script>

<Modal title="User informations">
  <ul>
    <li>{user.id}</li>
    <li>{user.name}</li>
    <li>{user.email}</li>
  </ul>
  Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias delectus ducimus
  harum. Nobis maxime quam enim facere at id doloribus, eius nisi delectus distinctio
  optio soluta blanditiis cumque nihil harum!

  <svelte:fragment slot="footer">
    <button class="btn" on:click={save}>Save</button>
    <button class="btn" on:click={close}>Cancel</button>
  </svelte:fragment>
</Modal>
