<script lang="ts">
  import { page } from '$app/stores'
</script>

<main class="flex h-full items-center justify-center bg-base-200">
  <div class="card max-w-lg bg-base-100 shadow-xl">
    <div class="card-body text-center">
      <div class="flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          stroke="red"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path
            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
          /><path d="M12 9v4" /><path d="M12 17h.01" /></svg
        >
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
