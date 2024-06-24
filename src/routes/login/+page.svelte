<script lang="ts">
  import { enhance } from '$app/forms'

  import type { ActionData } from './$types'

  export let form: ActionData
</script>

<main class="flex min-h-screen items-center justify-center bg-gray-100">
  <div class="w-full max-w-sm p-8 bg-white rounded-lg shadow-lg">
    <h1 class="text-2xl font-semibold text-center text-gray-700">Sign in</h1>
    <form
      method="post"
      use:enhance
      class="mt-6 flex flex-col gap-4"
    >
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
        <input class="input input-bordered w-full mt-1" name="username" id="username" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input class="input input-bordered w-full mt-1" type="password" name="password" id="password" />
      </div>
      <button class="btn btn-primary w-full mt-4">Continue</button>
      <p class="text-red-500 text-sm text-center mt-2">{form?.message ?? ''}</p>
    </form>
    <p class="mt-4 text-sm text-center text-gray-600">
      Don't have an account? <a href="/signup" class="text-primary hover:underline">Create an account</a>
    </p>
  </div>
</main>
