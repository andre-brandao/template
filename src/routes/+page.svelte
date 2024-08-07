<script>
  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'

  import Carousel from '$lib/components/landing-page/Carousel.svelte'
  import Carousel2 from '$lib/components/landing-page/Carousel2.svelte'
  import Features3 from '$lib/components/landing-page/features/Features3.svelte'
  import Pricing from '$lib/components/landing-page/pricing/Pricing.svelte'
  import Features4 from '$lib/components/landing-page/features/Features4.svelte'
  import Footer from '$lib/components/landing-page/Footer.svelte'

  import ShareButton from '$components/share/index.svelte'
  import HeroGlobe from '$lib/components/landing-page/hero/HeroGlobe.svelte'
</script>

<SEO
  {...getSEOProps({
    title: 'Home',
    featuredImage: {
      url: 'https://via.placeholder.com/672x448',
      alt: 'Placeholder image',
      width: 672,
      height: 448,
      caption: 'Home page',
    },
  })}
/>

<!-- <Modal onClose={console.log} onOpen={console.log}>Teste Modal</Modal> -->
<main class="flex flex-col gap-5 overflow-auto">
  <HeroGlobe />

  <!-- <div class="h-60 w-60">
    <RotatingGlobe></RotatingGlobe>
  </div> -->
  <!-- <ShareButton title="Home" url="https://example.com" /> -->

  <!-- <MapContact /> -->

  <Features3></Features3>

  <Pricing />

  <Features4></Features4>

  <Carousel />

  <Carousel2 />

  <Footer></Footer>
</main>
