<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  const email = data.user?.email

  import {
    loadStripe,
    type Stripe,
    type StripeElements,
  } from '@stripe/stripe-js'
  import {
    Elements,
    LinkAuthenticationElement,
    Address,
    PaymentElement,
  } from 'svelte-stripe'
  import { onMount } from 'svelte'
  import {
    PUBLIC_TESTE_STRIPE_KEY,
    PUBLIC_STRIPE_KEY,
  } from '$env/static/public'
  import { dev } from '$app/environment'

  import { trpc } from '$lib/utils/trpc/client'
  import { page } from '$app/stores'
  import { toast } from 'svelte-sonner'
  import { goto } from '$app/navigation'

  import {
    extractThemeColorsFromDOM,
    type ThemeColors,
  } from '$lib/client/utils/theme'
  import Loading from '$components/Loading.svelte'

  let stripe: Stripe | null = null

  let clientSecret: string | null = null

  let error = null
  let elements: StripeElements
  let processing = false

  let colors: ThemeColors | null = null

  onMount(async () => {
    try {
      stripe = await loadStripe(
        dev ? PUBLIC_TESTE_STRIPE_KEY : PUBLIC_STRIPE_KEY,
      )
      clientSecret = data.clientSecret
      colors = extractThemeColorsFromDOM()

      elements.update({

      })
      console.log(colors)
    } catch (error) {
      console.log(error)
    }
  })

  // async function createPaymentIntent() {
  //   try {
  //     const resp = await trpc($page).checkout.createPaymentIntent.mutate({
  //       amount: 1000,
  //     })

  //     return resp.client_secret
  //   } catch (error: any) {
  //     console.log(error)

  //     toast.error(error.message)
  //   }
  //   return null
  // }

  async function submit() {
    // avoid processing duplicates
    if (processing) return
    if (!stripe) return
    processing = true

    // confirm payment with stripe
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/checkout/order/success?payment_intent={PAYMENT_INTENT_ID}`,
      },
    })

    // log results, for debugging
    console.log({ result })

    if (result.error) {
      // payment failed, notify user
      error = result.error
      processing = false
    } else {
      // payment succeeded, redirect to "thank you" page
      goto('/checkout/success')
    }
  }
</script>

<div class="container mx-auto">
  {#if clientSecret && stripe && colors}
    <Elements
      {stripe}
      clientSecret={data.clientSecret}
      labels="floating"
      variables={{}}

      rules={{ '.Input': { border: 'solid 1px #0002' } }}
      bind:elements
    >
      <!-- colorPrimary: colors.primary,
      colorText: colors.primaryContent,
      colorBackground: colors.base200,
      colorBackgroundText: colors.baseContent -->
      <form on:submit|preventDefault={submit}>
        <LinkAuthenticationElement defaultValues={{email: email ?? ''}}/>
        <PaymentElement options={{}} />
        <Address mode="billing" />

        <button disabled={processing} class="btn btn-primary">
          {#if processing}
            Processing...
          {:else}
            Pay
          {/if}
        </button>
      </form>
    </Elements>
  {:else}
    <Loading />
  {/if}
</div>

<pre>
  {JSON.stringify(data.info, null, 2)}
</pre>

<style>
  .error {
    color: tomato;
    margin: 2rem 0 0;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 2rem 0;
  }

  button {
    padding: 1rem;
    border-radius: 5px;
    /* border: solid 1px #ccc; */
    /* color: white; */
    /* background: var(--link-color); */
    font-size: 1.2rem;
    margin: 1rem 0;
  }
</style>
