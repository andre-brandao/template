<script lang="ts">
	import { Card } from '@template/ui';
	import type { ProviderId } from '@template/core/auth/provider.sql';
	import Frame from '../components/Frame.svelte';
	import LoginForm from '../components/LoginForm.svelte';
	import OauthList from '../components/OauthList.svelte';

	let { oauth }: { oauth: ProviderId[] } = $props();
</script>

<Frame>
	<!-- One box for both: there is no separate signup, because a code for an address nobody
	     holds creates the account. Saying so is the only thing that makes that discoverable. -->
	<header>
		<h1>Log in or sign up</h1>
		<p class="sub">Enter your email. If you're new, the code creates your account.</p>
	</header>

	<Card>
		<LoginForm />
	</Card>

	<OauthList providers={oauth} />
</Frame>

<style>
	header {
		margin-bottom: 0.4em;
	}

	h1 {
		margin: 0 0 0.35em;
		font-size: 1.4em;
		font-weight: 600;
		letter-spacing: -0.015em;
	}

	.sub {
		margin: 0;
		font-size: 0.88em;
		line-height: 1.45;
		color: var(--muted);
	}
</style>
