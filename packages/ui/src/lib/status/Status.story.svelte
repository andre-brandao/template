<script module lang="ts">
	import type { Story } from '../story';
	import Status from './Status.svelte';
	import Button from '../input/Button.svelte';

	export const story: Story = {
		title: 'Status',
		blurb:
			'A save-state dot: `pending` pulses, `saved` flashes and fades, `failed` stays red with the message on hover. Pass `of={save}` or `of={[save, drop]}` (TanStack mutations) and it derives the state, pending first, then failed, then saved; `state`/`message` cover anything else. No visible text, and no live region of its own: a failure is read out once by the announcer `Toaster` mounts.',
		of: Status
	};

	const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
</script>

<script lang="ts">
	// import { Button, Status } from '@template/ui';

	// Stand-ins shaped like a TanStack mutation; a real one is `const save = update()`.
	const idle = { isPending: false, isError: false, isSuccess: false, error: null };
	let save = $state<{ isPending: boolean; isError: boolean; isSuccess: boolean; error: { message: string } | null }>({ ...idle });
	let drop = $state({ ...idle });

	async function run(fail: boolean) {
		save = { ...idle, isPending: true };
		await wait(600);
		save = fail ? { ...idle, isError: true, error: { message: 'Name is taken' } } : { ...idle, isSuccess: true };
	}
</script>

<p class="row">
	<span>Pending <Status state="pending" /></span>
	<span>Saved <Status state="saved" /></span>
	<span>Failed <Status state="failed" message="Name is taken" /></span>
</p>

<p class="row">
	<span>of={'{[save, drop]}'} <Status of={[save, drop]} /></span>
	<Button onclick={() => run(false)}>Save</Button>
	<Button onclick={() => run(true)}>Fail</Button>
	<Button variant="ghost" onclick={() => (drop = { ...idle, isPending: !drop.isPending })}>
		{drop.isPending ? 'Settle drop' : 'Hold drop'}
	</Button>
</p>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 2em;
		color: var(--muted);
	}
</style>
