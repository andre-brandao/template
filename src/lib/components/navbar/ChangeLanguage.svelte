<script lang="ts">
  import {
    setLanguageTag,
    sourceLanguageTag,
    availableLanguageTags,
    languageTag,
  } from '$lib/paraglide/runtime'

  import { goto } from '$app/navigation'

  function changeLanguage(l: (typeof availableLanguageTags)[number]) {
    setLanguageTag(l)
    if (sourceLanguageTag === l) {
      goto('/')
    } else {
      goto(`/${l}`)
    }
  }

  function getEmojiFlag(lang: string) {
    switch (lang) {
      case 'en':
        return '🇺🇸'
      case 'pt':
        return '🇧🇷'
      case 'zh':
        return '🇨🇳'
      case 'es':
        return '🇪🇸'
      case 'fr':
        return '🇫🇷'
      case 'de':
        return '🇩🇪'
      case 'ja':
        return '🇯🇵'
      case 'ko':
        return '🇰🇷'
      case 'pt':
        return '🇵🇹'
      case 'ru':
        return '🇷🇺'
      default:
        return '🌐'
    }
  }
</script>

<div class="dropdown dropdown-end">
  <div tabindex="0" role="button" class="btn m-1">
    {getEmojiFlag(languageTag())}
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
            {getEmojiFlag(lang)}
          </button>
        </li>
      {/if}
    {/each}
  </ul>
</div>
