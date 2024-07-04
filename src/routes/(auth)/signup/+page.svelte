<script lang="ts">
  import { enhance } from '$app/forms'

  import * as m from '$msgs'

  import type { ActionData } from './$types'

  export let form: ActionData
</script>

<main class="flex min-h-screen items-center justify-center">
  <div class="w-full max-w-sm rounded-lg p-8 shadow-lg">
    <h1 class="text-center text-2xl font-semibold">{m.create_an_account()}</h1>
    <form method="post" use:enhance class="mt-6 flex flex-col gap-4">
      <div>
        <label for="username" class="block text-sm font-medium">{m.username()}</label>
        <input
          class="input input-bordered mt-1 w-full"
          name="username"
          id="username"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium">{m.password()}</label>
        <input
          class="input input-bordered mt-1 w-full"
          type="password"
          name="password"
          id="password"
        />
      </div>
      <button class="btn btn-primary mt-4 w-full">Continue</button>
      <p class=" mt-2 text-center text-sm">{form?.message ?? ''}</p>
    </form>
    <p class="mt-4 text-center text-sm">
      {m.already_have_acc()}<a
        href="/login"
        class="text-primary hover:underline"
      >
        {m.sign_in()}
      </a>
    </p>
  </div>
</main>
