<script lang="ts">
    import { page } from '$app/stores'
    import {
      setLanguageTag,
      sourceLanguageTag,
      availableLanguageTags,
      languageTag,
    } from '$lib/paraglide/runtime'
  
    $: bredcrumbs = $page.url.pathname
      .split('/')
      .filter(Boolean)
      .filter(p => p !== languageTag())
      .map((bread, i, arr) => ({
        label: bread,
        href: arr.slice(0, i + 1).join('/'),
      }))
    console.log(bredcrumbs)
  
    function capitalize(s: string) {
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
  </script>
  
  <div class="breadcrumbs text-sm">
    <ul>
      {#each bredcrumbs as { href, label } (href)}
        <li>
          <a href="/{href}">{capitalize(label)}</a>
        </li>
      {/each}
    </ul>
  </div>