<script lang="ts">
  import type { User } from 'lucia'
  import ThemeSwiter from './ThemeSwiter.svelte'
  import ChangeLanguage from './ChangeLanguage.svelte'
  import Cart from './Cart.svelte'

  import { website } from '$lib/config'

  import { getUserContext } from '$lib/stores/user'
  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import NavItems from './NavItems.svelte'

  import { icons } from '$lib/utils/icons'
  import { goto } from '$app/navigation'

  const user = getUserContext()

  async function logout() {
    user.set(null)
    await trpc($page).auth.logOut.query()
    goto('/')
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
        <a href="/" class="btn btn-ghost text-xl max-sm:hidden">
          {website.siteShortTitle}
        </a>
      </div>

      <div class="hidden flex-none lg:block">
        <ul class="menu menu-horizontal space-x-1">
          <!-- Navbar menu content here -->
          <NavItems />
        </ul>
      </div>

      <div class="flex-none gap-2">
        {#if $user}
          <div class="dropdown dropdown-end dropdown-hover">
            <div tabindex="0" role="button" class="btn m-1">
              {$user.username}
            </div>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <ul
              tabindex="0"
              class="menu dropdown-content z-[1] w-52 rounded-box bg-base-300 p-2 shadow-lg"
            >
              <li><a href="/myprofile">{@html icons.user()} Meu Perfil</a></li>
              <li>
                <button onclick={logout}>{@html icons.logout()} Logout</button>
              </li>
            </ul>
          </div>
        {:else}
          <a class="btn" href="/login">{@html icons.login()}Login</a>
        {/if}

        <Cart />

        <ThemeSwiter />

        <ChangeLanguage />
      </div>
    </div>
    <slot />
  </div>
  <div class="drawer-side z-30">
    <label
      for="nav-drawer"
      aria-label="close sidebar"
      class="drawer-overlay"
    ></label>
    <ul class="menu min-h-full w-80 bg-base-200 p-4">
      <!-- Sidebar content here -->
      <NavItems />
    </ul>
  </div>
</div>
