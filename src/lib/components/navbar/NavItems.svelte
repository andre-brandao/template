<script lang="ts">
  import { icons } from '$lib/utils/icons'

  interface NavItem {
    name: string
    href: string
    icon?: string
  }
  const navItems: NavItem[] = [
    {
      name: 'Produtos',
      href: '/products',
    },
    {
      name: 'Homepage',
      href: '/',
      icon: icons.home(),
    },
    {
      name: 'DND',
      href: '/dnd',
    },
    {
      name: 'Datatable',
      href: '/datatable',
      icon: icons.table(),
    },
    {
      name: 'image',
      href: '/img',
    },
    {
      name: 'modal',
      href: '/modal',
    },
    {
      name: 'trpc',
      href: '/trpc',
    },
  ]
</script>

{#each navItems as { name, href, icon }, i}
  <li>
    <a {href}>
      {#if icon}
        {@html icon}
      {/if}
      {name}
    </a>
  </li>
{/each}

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="lucide lucide-search"
>
  <circle cx="11" cy="11" r="8" />
  <path d="m21 21-4.3-4.3" />
</svg>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="lucide lucide-line-chart"
>
  <path d="M3 3v18h18" />
  <path d="m19 9-5 5-4-4-3 3" />
</svg>
