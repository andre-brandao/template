<script lang="ts">
	import { Code, Full, Tabs } from '@template/ui';

	let { mail }: { mail: { subject: string; body: string; html: string } } = $props();

	const tabs = ['preview', 'text', 'source'] as const;
	let tab = $state<(typeof tabs)[number]>('preview');
	let el = $state<HTMLElement>();

	// Display only. `></` never falls inside a text node, so this can't split content.
	const source = $derived(mail.html.replaceAll('><', '>\n<'));
</script>

<div class="wrap">
	<header>
		<h1>{mail.subject}</h1>
		<Tabs.Root>
			{#each tabs as one (one)}
				<Tabs.Item active={tab === one} onclick={() => (tab = one)}>{one}</Tabs.Item>
			{/each}
		</Tabs.Root>
	</header>

	{#if tab === 'preview'}
		<div class="frame" bind:this={el}>
			<iframe srcdoc={mail.html} title={mail.subject}></iframe>
			<div class="bar"><Full {el} /></div>
		</div>
	{:else if tab === 'text'}
		<pre class="body">{mail.body}</pre>
	{:else}
		<div class="body"><Code value={source} lang="html" /></div>
	{/if}
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
		height: 100%;
		min-height: 0;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		flex-wrap: wrap;
	}

	h1 {
		margin: 0;
		font-size: 1.1em;
	}

	.frame {
		position: relative;
		flex: 1;
		min-height: 24em;
	}

	iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.frame:fullscreen iframe {
		border: none;
		border-radius: 0;
	}

	.bar {
		position: absolute;
		top: 0.6em;
		right: 0.6em;
		padding: 0.15em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.75em;
	}

	.body {
		flex: 1;
		min-height: 0;
		overflow: auto;
		margin: 0;
		padding: 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 0.8em;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
