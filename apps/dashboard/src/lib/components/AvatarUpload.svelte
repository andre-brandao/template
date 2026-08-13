<script lang="ts">
	import Avatar from './Avatar.svelte';

	let {
		name,
		image,
		url,
		size = 56,
		onchange
	}: {
		name: string;
		image: string | null;
		/** The `/avatars/{kind}/{id}` endpoint — POST swaps the image, DELETE clears it. */
		url: string;
		size?: number;
		onchange?: () => void;
	} = $props();

	let input = $state<HTMLInputElement>();
	let pending = $state(false);
	let issue = $state('');

	async function send(init: RequestInit) {
		pending = true;
		issue = '';
		const res = await fetch(url, init);
		if (!res.ok) issue = 'That didn’t work — try another image';
		pending = false;
		if (res.ok) onchange?.();
	}

	function pick(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = '';
		if (!file) return;
		const body = new FormData();
		body.append('file', file);
		send({ method: 'POST', body });
	}
</script>

<div class="wrap">
	<button
		type="button"
		class="pick"
		style="--size: {size}px"
		disabled={pending}
		onclick={() => input?.click()}
	>
		<Avatar {name} {image} {size} />
		<span class="hint">Edit</span>
	</button>
	<input bind:this={input} type="file" name="avatar" accept="image/*" hidden onchange={pick} />

	{#if image}
		<button type="button" class="clear" disabled={pending} onclick={() => send({ method: 'DELETE' })}>
			Remove
		</button>
	{/if}

	{#if issue}<span class="issue">{issue}</span>{/if}
</div>

<style>
	.wrap {
		display: flex;
		align-items: center;
		gap: 0.75em;
	}

	.pick {
		position: relative;
		display: inline-flex;
		width: var(--size);
		height: var(--size);
		padding: 0;
		border: none;
		border-radius: 50%;
		background: none;
		overflow: hidden;
		cursor: pointer;
	}

	.pick:disabled {
		cursor: wait;
		opacity: 0.6;
	}

	.hint {
		position: absolute;
		inset: auto 0 0;
		padding: 0.15em 0;
		font-family: var(--font-mono);
		font-size: calc(var(--size) * 0.2);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-align: center;
		color: white;
		background: rgb(0 0 0 / 0.55);
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.pick:hover .hint,
	.pick:focus-visible .hint {
		opacity: 1;
	}

	.clear {
		padding: 0;
		border: none;
		background: none;
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
		cursor: pointer;
	}

	.clear:hover {
		color: var(--danger);
	}

	.issue {
		color: var(--danger);
		font-size: 0.8em;
	}
</style>
