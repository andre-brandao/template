<script>
  import { onMount, onDestroy } from 'svelte'

  let activeIndex = 0
  /**
   * @type {HTMLDivElement}
   */
  let carousel
  const items = [
    'https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.jpg',
    'https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.jpg',
    'https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.jpg',
    'https://img.daisyui.com/images/stock/photo-1494253109108-2e30c049369b.jpg',
    'https://img.daisyui.com/images/stock/photo-1550258987-190a2d41a8ba.jpg',
    'https://img.daisyui.com/images/stock/photo-1559181567-c3190ca9959b.jpg',
    'https://img.daisyui.com/images/stock/photo-1601004890684-d8cbf643f5f2.jpg',
  ]

  /**
   * @type {number | undefined}
   */
  let interval

  function scrollCarousel() {
    // @ts-ignore
    const itemWidth = carousel.querySelector('.carousel-item').offsetWidth
    carousel.scrollTo({
      left: itemWidth * activeIndex,
      behavior: 'smooth',
    })
  }

  onMount(() => {
    interval = setInterval(() => {
      activeIndex = (activeIndex + 1) % items.length
      scrollCarousel()
    }, 3000) // Change slide every 3 seconds
  })

  onDestroy(() => {
    clearInterval(interval)
  })
</script>

<div
  bind:this={carousel}
  class="carousel carousel-center overflow-x-auto whitespace-nowrap rounded-box"
>
  {#each items as item, index}
    <div class="carousel-item inline-block">
      <img src={item} alt="Pizza" />
    </div>
  {/each}
</div>

<style>
  .carousel {
    scroll-behavior: smooth;
  }
</style>
