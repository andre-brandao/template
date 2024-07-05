<script lang="ts">
  import { page } from '$app/stores'
  import { icons } from '$lib/utils/icons'
</script>

<main class="flex h-full items-center justify-center bg-base-200">
  <div class="card max-w-lg bg-base-100 shadow-xl">
    <div class="card-body text-center">
      <div class="flex justify-center">
        {@html icons.warning({
          width: 45,
          height: 45,
          stroke: 'red',
        })}
      </div>
      <h1 class="mb-4 text-6xl font-bold text-error">{$page.status}</h1>
      <h2 class="mb-6 text-2xl font-semibold">Something went wrong</h2>
      <p class="mb-4">
        {$page.error?.message ||
          'An unexpected error has occurred. Please try again later.'}
      </p>
      <a href="/" class="btn btn-primary">Go Back Home</a>
    </div>
  </div>
</main>
