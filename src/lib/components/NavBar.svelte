<script lang="ts">
  import type { User } from 'lucia'
  import ThemeSwiter from './ThemeSwiter.svelte'
  export let user: User | null
</script>

<div class="navbar sticky top-0 z-10 bg-base-100">
  <div class="navbar-start">
    <div class="dropdown">
      <div tabindex="0" role="button" class="btn btn-circle btn-ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h7"
          /></svg
        >
      </div>
      <ul
        tabindex="0"
        class="menu dropdown-content menu-sm z-[777] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
      >
        <li><a>Homepage</a></li>
        <li><a>Portfolio</a></li>
        <li><a>About</a></li>
      </ul>
    </div>
  </div>
  <div class="navbar-center">
    <a class="btn btn-ghost text-xl">DedsTemplate</a>
  </div>
  <div class="navbar-end">
    <button class="btn btn-circle btn-ghost">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        /></svg
      >
    </button>
    {#if user}
      <form method="post" action="?/signout">
        <button type="submit">
          {user.username}
        </button>
      </form>
    {:else}
      <a href="/login">Login</a>
    {/if}

    <ThemeSwiter />
    <!-- <button class="btn btn-circle btn-ghost">
        <div class="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            /></svg
          >
          <span class="badge indicator-item badge-primary badge-xs"></span>
        </div>
      </button> -->
  </div>
</div>
