<script lang="ts">
  import { enhance } from '$app/forms'
  import Info from '$lib/client/components/Info.svelte'
  import type { PageData, ActionData } from './$types'

  export let data: PageData

  export let form: ActionData
</script>

<main class="container mx-auto">
  <form method="post" action="?/create_tenant" use:enhance>
    {#if form?.message !== undefined}
      <Info message={form.message} success={form.success} />
    {/if}

    <label for="tenantName">Company Name</label>
    <input
      type="text"
      id="tenantName"
      name="tenantName"
      class="input"
      required
      value={form?.form?.tenantName ?? ''}
    />

    <label for="subdomain">Subdomain</label>
    <input
      type="text"
      id="subdomain"
      name="subdomain"
      class="input"
      required
      value={form?.form?.subdomain ?? ''}
    />

    <label for="username">Username</label>
    <input
      type="text"
      id="username"
      name="username"
      class="input"
      required
      value={form?.form?.username ?? ''}
    />

    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      class="input"
      required
      value={form?.form?.email ?? ''}
    />

    <label for="password">Password</label>
    <input
      type="password"
      id="password"
      name="password"
      class="input"
      required
    />

    <label for="confirmPassword">Confirm Password</label>
    <input
      type="password"
      id="confirmPassword"
      name="confirmPassword"
      class="input"
      required
    />

    <button type="submit">Submit</button>
  </form>
</main>
