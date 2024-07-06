<script lang="ts">
  import {
    setLanguageTag,
    sourceLanguageTag,
    availableLanguageTags,
    languageTag,
  } from '$lib/paraglide/runtime'

  import { goto } from '$app/navigation'
  import { icons } from '$lib/utils/icons'

  function changeLanguage(l: (typeof availableLanguageTags)[number]) {
    setLanguageTag(l)
    if (sourceLanguageTag === l) {
      goto('/')
    } else {
      goto(`/${l}`)
    }
  }
</script>

<div class="dropdown dropdown-end dropdown-hover">
  <div tabindex="0" role="button" class="btn m-1">
    {icons.flags.getEmojiFlag(languageTag())}
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul
    tabindex="0"
    class="menu dropdown-content z-[1] space-y-1 rounded-box bg-base-100 p-2 shadow"
  >
    {#each availableLanguageTags as lang}
      {#if languageTag() !== lang}
        <li>
          <button class="btn" onclick={() => changeLanguage(lang)}>
            {icons.flags.getEmojiFlag(lang)}
          </button>
        </li>
      {/if}
    {/each}
  </ul>
</div>
