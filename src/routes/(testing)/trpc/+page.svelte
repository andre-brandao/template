<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  import { page } from '$app/stores'
  import { trpc } from '$lib/trpc/client'

  let greeting = 'press the button to load data'
  let loading = false

  const loadData = async () => {
    loading = true
    greeting = await trpc($page).greeting.query()
    loading = false
  }

  const loadData2 = async () => {
    loading = true
    greeting = await trpc($page).greetPerson.query(`John`)
    loading = false
  }
</script>

<main>
  <h6>Loading data in<br /><code>+page.svelte</code></h6>

  <a
    href="#load"
    role="button"
    class="secondary"
    aria-busy={loading}
    on:click|preventDefault={loadData}>Load</a
  >
  <p>{greeting}</p>

  <br />

  <a
    href="#load"
    role="button"
    class="secondary"
    aria-busy={loading}
    on:click|preventDefault={loadData2}>Load with argument</a
  >
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }

  h6 {
    margin-bottom: 1rem;
  }

  a {
    margin-top: 1rem;
    background-color: blue;
    color: white;
  }

  p {
    margin-top: 1rem;
  }
</style>
