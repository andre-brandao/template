<script lang="ts">
  import { modal, fadeScale, isActive } from '$lib/components/modal'
  import { fade } from 'svelte/transition'
  import { cubicInOut } from 'svelte/easing'
  const close = () => {
    modal.close()
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

{#if $isActive}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class=""
    transition:fade|global={{ duration: 150 }}
    on:click|self={close}
  >
    <article
      transition:fadeScale|global={{
        duration: 150,
        easing: cubicInOut,
        baseScale: 0.5,
      }}
      class="modal-box"
    >
      <svelte:component this={$modal.component} {...$modal.props} />
    </article>
  </section>
{/if}

<style>
  section {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9999;
  }

  article {
    max-height: 80vh;
    /* background: #fff; */
    margin: calc(auto - 4vh) auto;
    position: relative;
    border-radius: 4px;
    -webkit-box-shadow:
      0 24px 38px 3px rgba(0, 0, 0, 0.14),
      0 9px 46px 8px rgba(0, 0, 0, 0.12),
      0 11px 15px -7px rgba(0, 0, 0, 0.2);
    box-shadow:
      0 24px 38px 3px rgba(0, 0, 0, 0.14),
      0 9px 46px 8px rgba(0, 0, 0, 0.12),
      0 11px 15px -7px rgba(0, 0, 0, 0.2);
  }
</style>
