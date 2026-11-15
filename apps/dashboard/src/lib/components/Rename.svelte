<!--
	A row's rename: opens straight into an `Inline`, and ends when focus leaves or comes back to
	the unchanged face. A save in flight keeps it mounted, so its dot and revert can show.
-->
<script lang="ts">
	import { Inline } from '@template/ui';

	let {
		value,
		label,
		save,
		done
	}: {
		value: string;
		label: string;
		save: (next: string) => Promise<unknown>;
		done: () => void;
	} = $props();

	let open = false;
	let busy = false;

	function enter(e: FocusEvent) {
		const face = (e.target as HTMLElement).tagName === 'BUTTON';
		if (face && open && !busy) done();
		if (!face) open = true;
	}

	function leave(e: FocusEvent & { currentTarget: HTMLElement }) {
		if (!busy && !e.currentTarget.contains(e.relatedTarget as Node | null)) done();
	}
</script>

<div
	class="rename"
	onfocusin={enter}
	onfocusout={leave}
	{@attach (el) => el.querySelector('button')?.focus()}
>
	<Inline
		{label}
		{value}
		flush
		required
		onsave={(next) => {
			busy = true;
			// A failure re-arms, so focusing the failed face edits again instead of closing.
			return save(next)
				.then(done, (err) => {
					open = false;
					throw err;
				})
				.finally(() => (busy = false));
		}}
	/>
</div>

<style>
	/* Above a row's stretched link, so clicks land in the field. */
	.rename {
		position: relative;
		z-index: 1;
		min-width: 0;
	}
</style>
