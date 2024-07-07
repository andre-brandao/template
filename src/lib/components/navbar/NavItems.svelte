<script lang="ts">
  import { icons } from '$lib/utils/icons'
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
      name: 'Testing',
      // icon: icons.warning(),
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

  function isActive(href?: string) {
    // TODO: Fix translation home not working

    return (
      $page.url.pathname === href ||
      $page.url.pathname === '/' + languageTag() + href
    )
  }
</script>

{#each navItems as navItem, i}
  {@const { name, icon } = navItem}
  <li>
    {#if navItem.subItems}
      <details>
        <summary>
          {#if typeof navItem.icon === 'string'}
            {@html icon}
          {/if}
          {name}
        </summary>
        <ul>
          {#each navItem.subItems as subItem}
            {#if subItem.subItems}
              <svelte:self navItems={[subItem]} />
            {:else}
              <li>
                <a
                  href={subItem.href}
                  class:bg-primary={isActive(subItem.href)}
                >
                  {#if typeof navItem.icon === 'string'}
                    {@html icon}
                  {/if}

                  {subItem.name}
                </a>
              </li>
            {/if}
          {/each}
        </ul>
      </details>
    {:else}
      <a href={navItem.href} class:bg-primary={isActive(navItem.href)}>
        {#if typeof navItem.icon === 'string'}
          {@html icon}
        {/if}
        {name}
      </a>
    {/if}
  </li>
{/each}
