<script lang="ts">
  import { onMount } from 'svelte'
  import type { PageData } from './$types'
  import { goto } from '$app/navigation'

  export let data: PageData

  const order = data.recentOrder

  onMount(() => {
    setTimeout(() => {
      
      goto('/map')
      // window.location.reload()
    }, 5000)
  })
</script>

<div class="flex h-full items-center justify-center">
  <div class="w-full max-w-lg rounded-lg bg-base-200 p-8 shadow-lg">
    <div class="text-center">
      <!-- TODO: add image -->
      <!-- <div class="mb-4 flex justify-center">
        <img
          src="/path/to/your/success-icon.png"
          alt="Payment Successful"
          class="h-16 w-16"
        />
      </div> -->
      <h2 class="text-2xl font-semibold text-primary">Payment Successful!</h2>
      <p class="mt-2 text-gray-600">
        Thank you for your purchase. Your payment was successfully processed.
        and we added
        <span class="text-primary">
          {order.geopoints} GeoPoints
        </span>
        to your account
      </p>
      <!-- <div class="mt-6">
        <p class="text-gray-600">
          Transaction ID: <span class="font-semibold">#1234567890</span>
        </p>
        <p class="text-gray-600">
          Amount: <span class="font-semibold">$99.99</span>
        </p>
      </div> -->
    </div>
  </div>
</div>
