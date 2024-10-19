import adapter from '@sveltejs/adapter-vercel'
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  // preprocess: vitePreprocess(),
  vitePlugin: {
    inspector: {
      toggleKeyCombo: 'control-shift',
      holdMode: true,
      showToggleButton: 'always',
      toggleButtonPos: 'bottom-right',
      openKey: 'x'
    },
  },
  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),
    alias: {
      $lib: './src/lib',
      $db: './src/lib/server/db',
      $components: './src/lib/client/components',
      $utils: './src/lib/utils',
      "$utils/client": './src/lib/client/utils',
      "$utils/server": './src/lib/server/utils',
      $trpc: './src/lib/utils/trpc',
      $modal: './src/lib/client/components/modal',
      $msgs: './src/lib/i18n/paraglide/messages',
    },
  },
}

export default config
