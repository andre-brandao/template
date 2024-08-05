<script lang="ts">
  import { icons } from '$lib/utils/icons'

  import ThemeSwiter from './ThemeSwiter.svelte'
  import ChangeLanguage from './ChangeLanguage.svelte'

  import { modal } from '$lib/components/modal'
  import BugReportModal from '$lib/components/modal/BugReportModal.svelte'

  import {
    setLanguageTag,
    sourceLanguageTag,
    availableLanguageTags,
    languageTag,
  } from '$lib/paraglide/runtime'

  import { page } from '$app/stores'

  type NavItem = {
    name: string
    href?: string
    subItems?: NavItem[]
    icon?: string
  }

  export let navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: icons.home(),
    },
    {
      name: 'Chart',
      href: '/chart',
      icon: icons.chart.bar(),
    },
    {
      name: 'Cardapio',
      href: '/products',
    },
    {
      name: 'Admin',
      href: '/admin',
      subItems: [
        {
          name: 'Products',
          href: '/admin/products',
          // icon: icons.cube(),
        },
        {
          name: 'Users',
          href: '/admin/users',
          // icon: icons.users(),
        },
        {
          name: 'Customers',
          href: '/admin/customer',
          // icon: icons.users(),
        },
        {
          name: 'Orders',
          href: '/admin/orders',
          icon: icons.cart(),
        },
      ],
    },
    {
      name: 'Testing',
      icon: icons.warning(),
      href: '/testing',
      subItems: [
        {
          name: 'Datatable',
          href: '/datatable',
          icon: icons.table(),
        },
        {
          name: 'Modal',
          href: '/modal',
        },
        {
          name: 'Cardapio',
          href: '/products',
        },
        {
          name: 'Tanner',
          href: '/tanstack',
        },
        {
          name: 'Checkout',
          href: '/checkout',
          icon: icons.cart(),
        },
        {
          name: 'Inner Parent',
          href: '/inner-parent',
          subItems: [
            {
              name: 'Item 1',
              href: '/item-1',
            },
            {
              name: 'Item 2',
              href: '/item-2',
            },
          ],
        },
      ],
    },
  ]

  export let showDefaultItems = true

  function isActive(href?: string) {
    // TODO: Fix translation home not working

    return (
      $page.url.pathname === href ||
      $page.url.pathname === '/' + languageTag() + href ||
      ($page.url.pathname === '/' + languageTag() && href === '/')
    )
  }
</script>

{#each navItems as navItem, i (navItem.href)}
  {@const { name, icon } = navItem}
  <li>
    {#if navItem.subItems}
      <details>
        <summary>
          <!-- {#if typeof navItem.icon === 'string'}
            {@html icon}
          {/if} -->
          {name}
        </summary>
        <ul>
          {#each navItem.subItems as subItem, i (subItem.href)}
            {#if subItem.subItems}
              <svelte:self navItems={[subItem]} showDefaultItems={false} />
            {:else}
              <li>
                <a
                  href={subItem.href}
                  aria-current={isActive(subItem.href) ? 'page' : undefined}
                  class:active={isActive(subItem.href)}
                >
                  <!-- {#if typeof navItem.icon === 'string'}
                    {@html icon}
                  {/if} -->

                  {subItem.name}
                </a>
              </li>
            {/if}
          {/each}
        </ul>
      </details>
    {:else}
      <a
        href={navItem.href}
        aria-current={isActive(navItem.href) ? 'page' : undefined}
        class:active={isActive(navItem.href)}
      >
        <!-- {#if typeof navItem.icon === 'string'}
          {@html icon}
        {/if} -->
        {name}
      </a>
    {/if}
  </li>
{/each}

{#if showDefaultItems}
  <li>
    <button class="" onclick={() => modal.open(BugReportModal)}>
      {@html icons.bug()}
      Reportar Bug
    </button>
  </li>
{/if}

<style>
  a[aria-current='page']::before {
    view-transition-name: active-page;
    content: '●';
  }
</style>
