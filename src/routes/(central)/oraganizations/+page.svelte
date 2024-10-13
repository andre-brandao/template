<script lang="ts">
  import { PUBLIC_DOMAIN } from '$env/static/public'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<div class="container mx-auto flex flex-col items-center justify-center">
  {#each data.tenantsData as item}
    <a href="http://{item.subdomain}.{PUBLIC_DOMAIN}">
      <div
        class="my-2 flex w-full flex-row items-center justify-between rounded-lg bg-base-200 p-4"
      >
        <div class="flex flex-row items-center">
          <!-- <img src={item.logo} alt="logo" class="h-10 w-10 rounded-full" /> -->
          <div class="ml-4">
            <h1 class="text-lg font-semibold">{item.name}</h1>
            <p class="text-sm text-gray-500">{item.subdomain}</p>
          </div>
        </div>
      </div>
    </a>
  {/each}
</div>
