<script>
  import SEO from '$lib/components/SEO/index.svelte'
  import Cardapio from '$lib/components/Cardapio.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import ThemeSwiter from '$lib/components/navbar/ThemeSwiter.svelte'

  import Carousel from '$lib/components/landing-page/Carousel.svelte'
  import Carousel2 from '$lib/components/landing-page/Carousel2.svelte'
  import MapContact from '$lib/components/landing-page/contact/MapContact.svelte'
  import Hero from '$lib/components/landing-page/hero/Hero.svelte'
  import Dnd from '$lib/components/dnd/dnd-no-deps/DnDContainer.svelte'
  import { toast } from 'svelte-sonner'
  import { getSEOProps } from '$lib/utils/seo'
  import Features3 from '$lib/components/landing-page/features/Features3.svelte'
  import Pricing from '$lib/components/landing-page/pricing/Pricing.svelte'
  import Features4 from '$lib/components/landing-page/features/Features4.svelte'
  import Footer from '$lib/components/landing-page/Footer.svelte'
  import Payment from '$lib/components/Payment.svelte'
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
<main class="flex flex-col gap-5">
  <Hero />

  <MapContact />

  <Features3></Features3>

  <Pricing />

  <Features4></Features4>

  <Carousel />

  <Carousel2 />

  <Footer></Footer>
</main>
