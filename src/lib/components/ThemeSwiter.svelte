<script>
  import { themes, changeTheme } from '$lib'
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn m-1">
    Theme
    <svg
      width="12px"
      height="12px"
      class="inline-block h-2 w-2 fill-current opacity-60"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2048 2048"
      ><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"
      ></path></svg
    >
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul
    tabindex="0"
    class="dropdown-content z-[1] w-52 rounded-box bg-base-300 p-2 shadow-2xl max-h-[450px] overflow-y-scroll"
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
