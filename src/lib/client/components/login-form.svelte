<script lang="ts">
  import { enhance } from '$app/forms'
  import { Button } from '$lib/client/components/ui/button/index.js'
  import * as Card from '$lib/client/components/ui/card/index.js'
  import { Input } from '$lib/client/components/ui/input/index.js'
  import { Label } from '$lib/client/components/ui/label/index.js'
  import { page } from '$app/stores'

  import * as Tabs from '$lib/client/components/ui/tabs/index.js'
  import type { Snippet } from 'svelte'
  let {
    children,
  }: {
    children?: Snippet
  } = $props()

  const defaultForm = $page.url.searchParams.get('tab') ?? 'login'
</script>

<Tabs.Root value={defaultForm} class="w-[400px]">
  <Tabs.List class="grid w-full grid-cols-2">
    <Tabs.Trigger value="login">Login</Tabs.Trigger>
    <Tabs.Trigger value="signup">Signup</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="login">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-2xl">Login</Card.Title>
        <Card.Description>
          Enter your email below to login to your account
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          class="grid gap-4"
          method="post"
          action="/login?/password"
          use:enhance
        >
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              <a
                href="/reset-password"
                class="ml-auto inline-block text-sm underline"
              >
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
          <Tabs.Trigger value="signup">Signup</Tabs.Trigger>
        </div>
      </Card.Content>
    </Card.Root>
  </Tabs.Content>
  <Tabs.Content value="signup">
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-2xl">Singup</Card.Title>
        <Card.Description>
          Enter your email below to create an account
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          class="grid gap-4"
          method="post"
          action="/login?/signup"
          use:enhance
        >
          <div class="grid gap-2">
            <Label for="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="username"
              required
            />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password">Password</Label>
            </div>
            <Input id="password" type="password" name='password' required />
          </div>

          {@render children?.()}
          <Button type="submit" class="w-full">Sign up</Button>
          <Button href="/login/google" variant="outline" class="w-full">
            Login with Google
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </Tabs.Content>
</Tabs.Root>
