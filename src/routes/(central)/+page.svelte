<script lang="ts">
  import { enhance } from '$app/forms'
  import Info from '$lib/client/components/Info.svelte'
  import { website } from '$lib/config'
  import type { PageData, ActionData } from './$types'

  export let data: PageData

  export let form: ActionData
</script>

<main class="container mx-auto">
  <h1 class="text-center text-4xl">
    {website.siteTitle} - Create Tenant
  </h1>

  <form
    method="post"
    action="?/create_tenant"
    use:enhance
    class="flex flex-col"
  >
    {#if form?.message !== undefined}
      <Info message={form.message} success={form.success} />
    {/if}

    <label for="tenantName">Company Name</label>
    <input
      type="text"
      id="tenantName"
      name="tenantName"
      class="input input-bordered"
      required
      value={form?.form?.tenantName ?? ''}
    />

    <label for="subdomain">Subdomain</label>
    <input
      type="text"
      id="subdomain"
      name="subdomain"
      class="input input-bordered"
      required
      value={form?.form?.subdomain ?? ''}
    />

    <label for="username">Username</label>
    <input
      type="text"
      id="username"
      name="username"
      class="input input-bordered"
      required
      value={form?.form?.username ?? ''}
    />

    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      class="input input-bordered"
      required
      value={form?.form?.email ?? ''}
    />

    <label for="password">Password</label>
    <input
      type="password"
      id="password"
      name="password"
      class="input input-bordered"
      required
    />

    <label for="confirmPassword">Confirm Password</label>
    <input
      type="password"
      id="confirmPassword"
      name="confirmPassword"
      class="input input-bordered"
      required
    />

    <button type="submit" class="btn mt-4">Submit</button>
  </form>
</main>
