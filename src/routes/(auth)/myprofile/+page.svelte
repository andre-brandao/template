<script lang="ts">
  import SEO, { getSEOProps } from '$lib/components/SEO/index.svelte'

  import type { PageData } from './$types'
  import { getUserContext } from '$lib/stores/user'

  import { trpc } from '$trpc/client'
  import { page } from '$app/stores'
  const user = getUserContext()

  export let data: PageData

  const sessions = data.user_sessions

  import { onMount } from 'svelte'

  let nottifPermGranted: boolean | null = null
  let isSubscribed = false

  onMount(async () => {
    console.log(Notification.permission)

    nottifPermGranted = Notification.permission === 'granted'

    if (nottifPermGranted) {
      isSubscribed = await checkSubscriptionStatus()

      console.log(isSubscribed)

      if (!isSubscribed) {
        await subscribeUser()
      }
    }
  })

  function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('You are now subscribed to notifications!')
      }
    })
  }

  async function sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      console.log(subscription)
      const res = await trpc(
        $page,
      ).pushNotification.addPushNotificationDevice.query({
        subscription,
      })

      if (!res.success) {
        console.error(`Error saving subscription on server ${res.error}`)
      }
    } catch (error) {
      console.error('Error saving subscription on server:', error)
      unsubscribe()
    }
    // try {
    //   const res = await fetch('/api/addSubscription', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ subscription }),
    //   })
    //   if (!res.ok)
    //     throw new Error(
    //       `Error saving subscription on server: ${res.statusText} (${res.status})`,
    //     )
    // } catch (error) {
    //   console.error('Error saving subscription on server:', error)
    //   unsubscribe()
    // }
  }

  async function checkSubscriptionStatus() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      console.log('Subscription:', subscription)
      const exists = subscription !== null
      if (exists) {
        // just to make sure the subscription is saved on the server
        sendSubscriptionToServer(subscription)
      }
      return exists
    }
    return false
  }

  async function subscribeUser() {
    if ('serviceWorker' in navigator) {
      try {
        const res = await fetch('/api/vapidPubKey')
        const { data } = await res.json()
        console.log(data)

        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: data,
        })
        isSubscribed = true
        console.log('Subscription:', JSON.stringify(subscription))
        sendSubscriptionToServer(subscription)
      } catch (err) {
        console.error('Error subscribing:', err)
      }
    }
  }

  async function unsubscribe() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        isSubscribed = false
      }
    }
  }

  async function testNotification() {
    await trpc($page).pushNotification.sendTestNotification.query()
  }
</script>

<SEO
  {...getSEOProps({
    title: 'My Profile',
    description: 'Edit your profile',
  })}
/>

<div
  class="mx-auto w-full max-w-md rounded-lg border border-primary bg-base-200 shadow-sm"
>
  <div class="flex flex-col space-y-1.5 p-6">
    <h3
      class="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight"
    >
      Edit Profile
    </h3>
    <div class="space-y-6 p-6">
      <div class="flex flex-col items-center gap-4">
        <span
          class="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full"
        >
          <img
            class="aspect-square h-full w-full"
            src="https://generated.vusercontent.net/placeholder-user.jpg"
          />
        </span>
        <p>
          {$user?.username}
        </p>
        <p>
          {$user?.email}
        </p>
        <p>
          {$user?.email_verified ? 'verified' : 'not verified'}
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <h1>Sessions:</h1>

        {#each sessions as s}
          <div class="rounded bg-base-300 p-1">
            <p>
              id: {s.id}
            </p>
            <p>
              expiration: {new Date(s.expiresAt)}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="px-4">
    <h1 class="">Settings</h1>

    <div class="mt-4">
      <h2 class="">Push Notifications</h2>
      <p>Receive notifications when albums are updated.</p>
      <div class="mt-3 space-y-3">
        {#if nottifPermGranted === null}
          <p>Checking permissions...</p>
        {:else if nottifPermGranted === false}
          <button
            class="btn btn-outline"
            type="button"
            onclick={requestNotificationPermission}
          >
            Enable notifications
          </button>
        {:else}
          <p>
            Subscribed to push notifications: <b>{isSubscribed}</b>
          </p>
          {#if isSubscribed}
            <div class="pb-5">
              <button
                class="btn btn-outline"
                type="button"
                onclick={unsubscribe}
              >
                Unsubscribe
              </button>
              <button class="btn btn-outline" onclick={testNotification}>
                Test Notification
              </button>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>
