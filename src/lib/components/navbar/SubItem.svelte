<script lang="ts">
  import { icons } from '$lib/utils/icons'

  type NavItem = {
    name: string
    href: string
    subItems?: NavItem[]
    icon?: string
  }

  export let navItems: NavItem[] = []
</script>

{#each navItems as navItem, i}
  {@const { name, icon } = navItem}
  <li>
    {#if navItem.subItems}
      <details open>
        <summary>{name}</summary>
        <ul>
          {#each navItem.subItems as subItem}
            {#if subItem.subItems}
              <svelte:self navItems={subItem.subItems} />
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
