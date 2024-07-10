<script>
  import { browser } from '$app/environment'
  import Facebook from '$lib/components/share/Facebook.svelte'
  import Telegram from '$lib/components/share/Telegram.svelte'
  import Twitter from '$lib/components/share/Twitter.svelte'
  import Whatsapp from '$lib/components/share/WhatsApp.svelte'
  import { website } from '$lib/config'

  const { siteTitle, siteUrl } = website

  export let title

  export let url

  $: webShareAPISupported = browser && typeof navigator.share !== 'undefined'

  $: handleWebShare
  const handleWebShare = async () => {
    try {
      navigator.share({
        title,
        text: `Shared from ${siteTitle}`,
        url,
      })
    } catch (error) {
      webShareAPISupported = false
    }
  }
</script>

<div class="buttons">
  {#if webShareAPISupported}
    <button on:click={handleWebShare}>
      <span class="screen-reader-text">Share</span>
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
        class="lucide lucide-share"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </svg>
    </button>
  {:else}
    <Twitter {url} {title} />
    <Facebook {url} />
    <Whatsapp {url} {title} />
    <Telegram {url} {title} />
  {/if}
</div>

<style>
  .buttons {
    margin-left: 1rem; /* Adjust according to your spacing scale */
    transition: all 0.2s ease-in-out;
  }

  button {
    background: transparent;
    border-style: none;
    transition: all 0.2s ease-in-out;
  }

  @media (prefers-reduced-motion: reduce) {
    button {
      transition: all 2s ease-in-out;
    }
  }

  button:focus,
  button:hover {
    transform: scale(1.1);
  }
</style>
