<script>
  import SEO from '$lib/components/SEO/index.svelte'

  import Carousel from '$lib/components/landing-page/Carousel.svelte'
  import Carousel2 from '$lib/components/landing-page/Carousel2.svelte'
  import { getSEOProps } from '$lib/utils/seo'
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
      src: 'https://via.placeholder.com/672x448',
      alt: 'Placeholder image',
    },
    ogImageSrc: 'https://via.placeholder.com/1200x627',
    ogSquareImageSrc: 'https://via.placeholder.com/400x400',
    twitterImageSrc: 'https://via.placeholder.com/1200x675',
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
