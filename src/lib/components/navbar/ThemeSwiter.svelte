<script>
  import { themes, changeTheme } from '$lib'
  import { icons } from '$lib/utils/icons'
</script>

<div class="dropdown dropdown-end dropdown-bottom">
  <button tabindex="0" class="btn">
    {@html icons.pallete()}
  </button>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul
    tabindex="0"
    class="dropdown-content z-[50] max-h-[450px] w-52 overflow-y-scroll rounded-box bg-base-300 p-2 shadow-2xl"
  >
    {#each themes as t}
      <li>
        <input
          type="radio"
          name="theme-dropdown"
          class="theme-controller btn btn-ghost btn-sm btn-block justify-start"
          aria-label={t}
          value={t}
        />
      </li>
    {/each}
  </ul>
</div>
