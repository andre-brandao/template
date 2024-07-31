<script>
  import * as m from '$msgs'

  import RetroGrid from '../../animation/RetroGrid.svelte'
  import RotatingGlobe from '../globe/RotatingGlobe.svelte'
</script>

<div class="h-[80vh] flex items-center justify-center">
  <div
    class=" relative flex gap-5 size-full items-center justify-center overflow-hidden rounded-lg  p-20 h-full md:max-w-[80%] md:shadow-xl"
  >
    <span
      class="text-7xl"
    >
      {m.hero_title()}
    </span>
    <div style="width: 400px; height: 400px; z-index: 100;">
      <RotatingGlobe />
    </div>

    <RetroGrid />
  </div>
</div>
