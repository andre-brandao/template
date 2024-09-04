<script lang="ts">
  interface InfoProps {
    success?: boolean
    message: string
  }
  let { success, message }: InfoProps = $props()
</script>

<div
  role="alert"
  class="alert"
  class:alert-success={success === true}
  class:alert-error={success === false}
>
  {#if success === true}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="black"
      viewBox="0 0 24 24"
      class="h-6 w-6 shrink-0 "
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  {:else if success === false}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 shrink-0 "
      fill="none"
      stroke="black"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 shrink-0 "
      fill="none"
      stroke="black"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  {/if}
  <span>{message}</span>
</div>
