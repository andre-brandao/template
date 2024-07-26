<script lang="ts">
  import { modal } from '$lib/components/modal'
  export let title = ''
</script>

<header class="handle">
  <aside>
    <span>{@html title}</span>
  </aside>
  <!-- <button type="button" on:click={() => modal.close()}>
        <i class="micon">clear</i>
    </button> -->
  <button
    type="button"
    on:click={() => modal.close()}
    class="btn btn-circle btn-ghost btn-sm absolute right-1"
  >
    ✕
  </button>
</header>

<section>
  <slot />
</section>

<footer>
  <slot name="footer" />
</footer>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* background: #f5f5f5; */
    border-radius: 4px 4px 0 0;
    user-select: none;
  }
  header button {
    cursor: pointer;
    border-radius: 4px;
    border: none;
    background: transparent;
    transition: all, 0.2s;
    color: #e57373;
    height: 32px;
    width: 32px;
    padding: 0;
  }
  header button:hover {
    color: #d32f2f;
  }
  header button i {
    margin: 0;
    line-height: 32px;
  }
  header aside {
    color: #616161;
    font-weight: normal;
    font-size: 16px;
  }
  header aside i {
    margin: 0 4px;
    color: #757575;
  }

  aside {
    font-size: 16px;
    margin: 0;
    margin-right: 8px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  footer {
    height: 56px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 0;
    border-radius: 0 0 4px 4px;
    user-select: none;
  }

  /* footer :global(button) {
    border: 1px solid #e0e0e0;
    outline: none;
    width: auto;
    height: 34px;
    background: #eee;
    transition: all, 0.5s;
    cursor: pointer;
    margin-right: 12px;
    padding: 0 16px;
    color: #212121;
    border-radius: 2px;
    font-size: 14px;
  } */
  /* footer :global(button):hover {
    border: 1px solid var(--primary);
    background: #fafafa;
  }
  footer :global(button):active {
    background: #e0e0e0;
  } */
</style>
