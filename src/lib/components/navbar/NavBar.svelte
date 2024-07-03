<script lang="ts">
  import type { User } from 'lucia'
  import ThemeSwiter from './ThemeSwiter.svelte'

  import { website } from '$lib/config'

  import { user } from '$lib/stores/user'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import NavItems from './NavItems.svelte'

  import { modal } from '$lib/components/modal'
  import BugReportModal from '$lib/components/modal/BugReportModal.svelte'

  async function logout() {
    user.set(null)
    await trpc($page).auth.logOut.query()
  }
</script>

<div class="drawer">
  <input id="nav-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex h-screen flex-col overflow-hidden">
    <!-- Navbar -->
    <div class="navbar sticky top-0 z-20 w-full bg-base-100">
      <div class="flex-none lg:hidden">
        <label
          for="nav-drawer"
          aria-label="open sidebar"
          class="btn btn-square btn-ghost"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            class="inline-block h-6 w-6 stroke-current"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </label>
      </div>
      <div class="mx-2 flex-1 px-2">
        <a href="/" class="btn btn-ghost text-xl">{website.siteTitle}</a>
      </div>

      <div class="hidden flex-none lg:block">
        <ul class="menu menu-horizontal">
          <!-- Navbar menu content here -->
          <NavItems />
        </ul>
      </div>

      <div class="flex-none gap-2">
        <button class="btn" onclick={() => modal.open(BugReportModal)}>
          Reportar Bug
        </button>

        {#if $user}
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn m-1">
              {$user.username}
            </div>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <ul
              tabindex="0"
              class="menu dropdown-content z-[1] w-52 rounded-box bg-base-300 p-2 shadow-lg"
            >
              <li><a href="/myprofile">Meu Perfil</a></li>
              <li><button onclick={logout}>Logout</button></li>
            </ul>
          </div>
        {:else}
          <a class="btn" href="/login">Login</a>
        {/if}

        <ThemeSwiter />
      </div>
    </div>
    <slot>Page content here</slot>
  </div>
  <div class="drawer-side z-30">
    <label for="nav-drawer" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <ul class="menu min-h-full w-80 bg-base-200 p-4">
      <!-- Sidebar content here -->
      <NavItems />
    </ul>
  </div>
</div>
<!-- <div class="navbar sticky top-0 z-10 bg-base-100">
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
        <li><a href="/">Homepage</a></li>
        <li><a href="/dnd">DND</a></li>
        <li><a href="/datatable">Datatable</a></li>
        <li><a href="/tanstack">tanstack</a></li>
        <li><a href="/cardapio">Cardapio</a></li>
        <li><a href="/img">image</a></li>
        <li><a href="/modal">modal</a></li>
        <li><a href="/trpc">trpc</a></li>
      </ul>
    </div>
  </div>
  <div class="navbar-center">
    <a href="/" class="btn btn-ghost text-xl">{website.siteShortTitle}</a>
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
    {#if $user}
      <div class="dropdown">
        <div tabindex="0" role="button" class="btn m-1">{$user.username}</div>
        <ul
          tabindex="0"
          class="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
        >
          <li><a href="/myprofile">Meu Perfil</a></li>
          <li><button onclick={logout}>Logout</button></li>
        </ul>
      </div>
    {:else}
      <a href="/login">Login</a>
    {/if}

    <ThemeSwiter />

  </div>
</div> -->
