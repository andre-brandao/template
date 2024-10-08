<script>
  import { availableLanguageTags, languageTag } from '$lib/i18n/paraglide/runtime.js'
  import { i18n } from '$lib/i18n/i18n'
  import { page } from '$app/stores'
  import { icons } from '$lib/client/utils/icons'
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
