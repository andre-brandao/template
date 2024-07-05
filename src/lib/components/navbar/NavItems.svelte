<script lang="ts">
  import { icons } from '$lib/utils/icons'

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
    },
    {
      name: 'Testing',
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
    {
      name: 'Item 3',
      href: '/item-3',
    },
  ]
</script>

<!-- <SubItem {navItems} /> -->
{#each navItems as navItem, i}
  {@const { name, icon } = navItem}
  <li>
    {#if navItem.subItems}
      <details>
        <summary>{name}</summary>
        <ul>
          {#each navItem.subItems as subItem}
            {#if subItem.subItems}
              <svelte:self navItems={[subItem]} />
            {:else}
              <li>
                <a href={subItem.href}>{subItem.name}</a>
              </li>
            {/if}
          {/each}
        </ul>
      </details>
    {:else}
      <a href={navItem.href}>{name}</a>
    {/if}
  </li>
{/each}
