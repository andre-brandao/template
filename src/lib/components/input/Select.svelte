<script lang="ts" generics="T">
  let input = ''

  let new_input = ''

  export let add:
    | ((value: string) => Promise<{ value: any; label: string }>)
    | undefined

  export let value: any = undefined
  export let options: {
    value: any
    label: string
  }[]

  let isLoading = false

  async function handleAdd() {
    if (!add) return
    isLoading = true
    const new_option = await add(new_input)
    isLoading = false
    new_input = ''
    options = [...options, new_option]
    value = new_option.value
    input = new_option.label
  }
</script>

<div class="dropdown">
  <input
    tabindex="0"
    bind:value={input}
    class="input input-bordered w-full"
    type="text"
  />
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul
    tabindex="0"
    class="menu dropdown-content z-[999] rounded-box bg-base-100 p-2 shadow"
  >
    <ul class="menu">
      {#each options as item}
        <li class="">
          <button
            onclick={() => {
              value = item.value
              input = item.label
              // open = false
            }}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>

    {#if add}
      <div class="flex gap-2 rounded-box bg-base-300 p-1">
        <input type="text" class="input" bind:value={new_input} />
        <button
          class="btn btn-primary"
          onclick={handleAdd}
          disabled={isLoading}
        >
          +
        </button>
      </div>
    {/if}
  </ul>
</div>

<style>
  summary::-webkit-details-marker {
    display: none;
  }

  summary {
    list-style: none; /* Ensure it's styled like a regular element */
    cursor: pointer; /* Show pointer cursor to indicate it's clickable */
  }
</style>
