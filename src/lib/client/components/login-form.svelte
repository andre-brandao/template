<script lang="ts">
  import { Button } from '$lib/client/components/ui/button/index.js'
  import * as Card from '$lib/client/components/ui/card/index.js'
  import { Input } from '$lib/client/components/ui/input/index.js'
  import { Label } from '$lib/client/components/ui/label/index.js'
  import type { Snippet } from 'svelte'
  let {
    children,
  }: {
    children?: Snippet
  } = $props()
</script>

<Card.Root class="mx-auto max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Login</Card.Title>
    <Card.Description>
      Enter your email below to login to your account
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="grid gap-4" method="post" action="/login/password?/login">
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" required />
      </div>
      <div class="grid gap-2">
        <div class="flex items-center">
          <Label for="password">Password</Label>
          <a href="##" class="ml-auto inline-block text-sm underline">
            Forgot your password?
          </a>
        </div>
        <Input id="password" type="password" required />
      </div>

      {@render children?.()}
      <Button type="submit" class="w-full">Login</Button>
      <Button href="/login/google" variant="outline" class="w-full">
        Login with Google
      </Button>
    </form>
    <div class="mt-4 text-center text-sm">
      Don't have an account?
      <a href="##" class="underline">Sign up</a>
    </div>
  </Card.Content>
</Card.Root>
