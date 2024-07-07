<script lang="ts" generics="T">
  let input = ''

  export let value = 0
  let options = [
    {
      value: 1,
      label: 'One',
    },
    {
      value: 2,
      label: 'Two',
    },
    {
      value: 3,
      label: 'Three',
    },
    {
      value: 4,
      label: 'Four',
    },
    {
      value: 5,
      label: 'Five',
    },
  ]
  let open = false
</script>

<details bind:open class="dropdown">
  <summary class="">
    <input
      bind:value={input}
      class="input input-bordered"
      type="text"
      onfocusin={() => (open = true)}
    />
  </summary>

  <div class="dropdown-content z-[1] rounded-box bg-base-100 p-2 shadow">
    <ul class="menu">
      {#each options as item}
        <li class="">
          <button
            onclick={() => {
              value = item.value
              input = item.label
              open = false
            }}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>
    <div class="flex gap-2 rounded-box bg-base-300 p-1">
      <input type="text" class="input" />
      <button class="btn">+</button>
    </div>
  </div>
</details>
