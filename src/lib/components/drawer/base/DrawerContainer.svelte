<script>
  import { isActive, drawer } from '../.'
</script>

<div class="drawer drawer-end">
  <input
    id="drawer-store"
    bind:checked={$isActive}
    type="checkbox"
    class="drawer-toggle"
  />

  <div class="drawer-content">
    <slot>Page content here</slot>
  </div>
  <div class="drawer-side z-50">
    <label
      for="drawer-store"
      aria-label="close sidebar"
      class="drawer-overlay"
    ></label>
    <ul class="menu min-h-full w-80 bg-base-200 p-4 text-base-content">
      <svelte:component this={$drawer.component} {...$drawer.props} />
    </ul>
  </div>
</div>
