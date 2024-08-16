<!-- <script lang="ts">
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
</div> -->

<script>
  import { availableLanguageTags, languageTag } from '$lib/paraglide/runtime.js'
  import { i18n } from '../../i18n'
  import { page } from '$app/stores'
  import { icons } from '$lib/utils/icons'
</script>

<div class="dropdown dropdown-end dropdown-hover">
  <div tabindex="0" role="button" class="btn m-1">
    {icons.flags.getEmojiFlag(languageTag())}
  </div>
  <ul
    tabindex="0"
    class="menu dropdown-content z-[1] space-y-1 rounded-box bg-base-100 p-2 shadow"
  >
    {#each availableLanguageTags as lang}
      <li>
        <a
          href={i18n.route($page.url.pathname)}
          hreflang={lang}
          aria-current={lang === languageTag() ? 'page' : undefined}
        >
          {icons.flags.getEmojiFlag(lang)}
        </a>
      </li>
    {/each}
  </ul>
</div>
