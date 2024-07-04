<!-- <script lang="ts">
  import type { PageData } from './$types'
  import { toast } from 'svelte-sonner'

  export let data: PageData

  import { page } from '$app/stores'
  import { trpc } from '$trpc/client'
  import { tokenizeCard } from '$lib/utils/pagarme'
  let test: any
  let loading = false

  // const loadData = async () => {
  //   loading = true
  //   greeting = await trpc($page).greeting.query()
  //   loading = false
  // }

  let eror: unknown
  const pagarmeTest = async () => {
    loading = true
    const address = {
      line_1: '7221, Avenida Dra Ruth Cardoso, Pinheiros',
      line_2: '',
      zip_code: '05425070',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
    }

    const { data: tokenCard, error } = await tokenizeCard({
      number: '4000000000000010',
      holder_name: 'Tony Stark',
      exp_month: 1,
      exp_year: 30,
      cvv: '531',
    })
    console.log(tokenCard)

    if (error || !tokenCard?.id) {
      console.log(tokenCard, error)
      toast.error('Erro ao gerar token do cartão')
      return
    }

    const payload = {
      closed: true,
      customer: {
        name: 'Tony Stark',
        document: '03154435026',
        type: 'individual',
        email: 'avengerstark@ligadajustica.com.br',
        phones: {
          home_phone: {
            country_code: '55',
            area_code: '11',
            number: '000000000',
          },
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '000000000',
          },
        },
        address,
      },
      items: [
        {
          amount: 2990,
          description: 'Chaveiro do Tesseract',
          quantity: 1,
          code: 123,
        },
      ],
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            operation_type: 'auth_and_capture',
            installments: 1,
            statement_descriptor: 'AVENGERS', //Máximo de 13 caracteres
            card_token: tokenCard.id,
            card: {
              billing_address: address,
            },
          },
        },
      ],
    }

    try {
      const { data: result, error } =
        await trpc($page).pagarme.cardToken.query(payload)
      console.log(result)

      test = result
      eror = error
      loading = false
    } catch (error) {
      console.log(error)
      eror = error
      loading = false
    }
    console.log(test)
    loading = false
  }
</script>

<pre>
  {JSON.stringify(test, null, 2)}
</pre>

<pre>
  {JSON.stringify(eror, null, 2)}
</pre>
<div>
  {#if loading}
    Loading...
  {:else}
    <button class="btn" disabled={loading} on:click={pagarmeTest}>Test</button>
  {/if}
</div> -->
