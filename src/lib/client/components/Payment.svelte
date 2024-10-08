<script lang="ts">
  import { website } from '$lib/config'
  import { tweened } from 'svelte/motion'

  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  import { toast } from 'svelte-sonner'

  let form = {
    full_name: 'Tony Stark',
    card_number: '4000000000000010',
    expiration: {
      month: 2,
      year: 30,
    },
    cvv: '123',
  }
  let items: {
    id: string
    name: string
    price: number
    quantity: number
    isDiscounted?: boolean
  }[] = [
    {
      id: '1',
      name: 'Product 1',
      price: 1000,
      quantity: 2,
    },
    {
      id: '2',
      name: 'Product 2',
      price: 2000,
      quantity: 1,
    },
    {
      id: '3',
      name: 'Discount 3',
      price: -200,
      quantity: 1,
    },
  ]

  const total = tweened(0, {
    delay: 250,
    duration: 500,
  })

  // async function handleCheckout() {
  //   const cardToken = await tokenizeCard({
  //     number: '4000000000000010',
  //     holder_name: 'Tony Stark',
  //     exp_month: 2,
  //     cvv: '123',
  //     exp_year: 2030,
  //   })

  //   console.log(cardToken)

  //   if (cardToken.error) {
  //     toast.error(JSON.stringify(cardToken.error))
  //     return
  //   }

  //   const address = {
  //     line_1: '7221, Avenida Dra Ruth Cardoso, Pinheiro',
  //     line_2: 'Prédio',
  //     zip_code: '05425070',
  //     city: 'São Paulo',
  //     state: 'SP',
  //     country: 'BR',
  //   }

  //   const resp = await trpc($page).pagarme.cardToken.mutate({
  //     customer: {
  //       name: 'Tony Stark',
  //       type: 'individual',
  //       email: 'avengerstark@ligadajustica.com.br',
  //       document: '03154435026',
  //       address,
  //       phones: {
  //         home_phone: {
  //           country_code: '55',
  //           area_code: '11',
  //           number: '000000000',
  //         },
  //         mobile_phone: {
  //           country_code: '55',
  //           area_code: '11',
  //           number: '000000000',
  //         },
  //       },
  //     },
  //     items: [
  //       {
  //         amount: 2990,

  //         code: 123,
  //         description: 'Chaveiro do Tesseract',
  //         quantity: 2,
  //       },
  //     ],

  //     payments: [
  //       {
  //         credit_card: {
  //           operation_type: 'auth_and_capture',
  //           installments: 1,
  //           statement_descriptor: 'Pagamento',
  //           card_token: cardToken.data.id,
  //           card: {
  //             billing_address: address,
  //           },
  //         },
  //       },
  //     ],
  //   })

  //   if (resp.error) {
  //     toast.error(JSON.stringify(resp.error))
  //     return
  //   }
  //   console.log(resp)
  // }

  $: {
    total.set(items?.reduce((acc, item) => acc + item.price * item.quantity, 0))
  }
</script>

<section class=" py-8 antialiased md:py-16">
  <div class="mx-auto max-w-screen-xl px-4 2xl:px-0">
    <div class="mx-auto max-w-5xl">
      <h2 class="text-xl font-semibold sm:text-2xl">Payment</h2>

      <div class="mt-6 sm:mt-8 lg:flex lg:items-start lg:gap-12">
        <form
          on:submit|preventDefault={()=>(console.log('submit'))}
          action="#"
          class="w-full rounded-lg border border-primary p-4 shadow-sm sm:p-6 lg:max-w-xl lg:p-8"
        >
          <div class="mb-6 grid grid-cols-2 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label for="full_name" class="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                bind:value={form.full_name}
                type="text"
                id="full_name"
                class="input block w-full rounded-lg border border-primary text-sm focus:border-primary focus:ring-primary"
                placeholder="Bonnie Green"
                required
              />
            </div>

            <div class="col-span-2 sm:col-span-1">
              <label
                for="card-number-input"
                class="mb-2 block text-sm font-medium"
              >
                Card number*
              </label>
              <input
                bind:value={form.card_number}
                type="text"
                id="card-number-input"
                class="input block w-full rounded-lg border border-primary text-sm focus:border-primary focus:ring-primary"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                required
              />
              <!-- pattern="^4[0-9]{12}(?:[0-9]{3})?$" -->
            </div>

            <div>
              <label
                for="card-expiration-input"
                class="mb-2 block text-sm font-medium"
              >
                Card expiration*
              </label>
              <div class="relative">
                <div
                  class="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5"
                ></div>
                <!-- datepicker -->
                <input
                  on:change={e => {
                    // @ts-ignore
                    const val = e.target.value.split('/')

                    if (val.length < 2) {
                      return
                    }

                    const month = val[0]
                    const year = val[1]
                    form.expiration = { month, year }
                  }}
                  id="card-expiration-input"
                  type="text"
                  class="input block w-full rounded-lg border border-primary text-sm focus:border-primary focus:ring-primary"
                  placeholder="12/23"
                  required
                />
              </div>
            </div>
            <div>
              <label
                for="cvv-input"
                class="mb-2 flex items-center gap-1 text-sm font-medium"
              >
                CVV*
                <button
                  data-tooltip-target="cvv-desc"
                  data-tooltip-trigger="hover"
                  class="   "
                >
                  <svg
                    class="h-4 w-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  id="cvv-desc"
                  role="tooltip"
                  class="tooltip invisible absolute z-10 inline-block rounded-lg px-3 py-2 text-sm font-medium opacity-0 shadow-sm transition-opacity duration-300"
                >
                  The last 3 digits on back of card
                  <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
              </label>
              <input
                bind:value={form.cvv}
                type="number"
                id="cvv-input"
                aria-describedby="helper-text-explanation"
                class="input block w-full rounded-lg border border-primary text-sm focus:border-primary focus:ring-primary"
                placeholder="•••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            class="btn flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4"
          >
            Pay now
          </button>
        </form>

        <div class="mt-6 grow sm:mt-8 lg:mt-0">
          <div class="space-y-4 rounded-lg border border-secondary p-6">
            <div class="space-y-2">
              {#each items as item}
                <!-- content here -->
                <dl class="flex items-center justify-between gap-4">
                  <dt class=" text-base font-normal">
                    {item.name}
                  </dt>
                  <dd
                    class="text-base font-medium"
                    class:text-green-300={item.price < 0}
                  >
                    ${item.price}
                  </dd>
                </dl>
              {/each}
            </div>

            <dl
              class="flex items-center justify-between gap-4 border-t border-primary pt-2"
            >
              <dt class="text-base font-bold">Total</dt>
              <dd class="text-base font-bold">${$total.toFixed(2)}</dd>
            </dl>
          </div>

          <div class="mt-6 flex items-center justify-center gap-8">
            <img
              class="hidden h-8 w-auto"
              src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/paypal.svg"
              alt=""
            />
            <img
              class="flex hidden h-8 w-auto"
              src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/paypal-dark.svg"
              alt=""
            />
            <img
              class="hidden h-8 w-auto"
              src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/visa.svg"
              alt=""
            />
            <img
              class="flex hidden h-8 w-auto"
              src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/visa-dark.svg"
              alt=""
            />
            <img
              class="hidden h-8 w-auto"
              src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/mastercard.svg"
              alt=""
            />
            <img
              class="flex hidden h-8 w-auto"
              src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/brand-logos/mastercard-dark.svg"
              alt=""
            />
          </div>
        </div>
      </div>

      <p class=" mt-6 text-center text-gray-500 sm:mt-8 lg:text-left">
        Payment processed by <a
          href="#"
          title=""
          class="text-primary-700 font-medium text-primary underline hover:no-underline"
        >
          Pagarme
        </a>
        for
        <a
          href="#"
          title=""
          class="text-primary-700 font-medium text-primary underline hover:no-underline"
        >
          {website.siteTitle}
        </a>
      </p>
    </div>
  </div>
</section>
