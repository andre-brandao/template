<script lang="ts">
	import { Field, Input, Select } from '@template/ui';
	import type { doc } from './api.remote';

	type Param = Awaited<ReturnType<typeof doc>>['list'][number]['params'][number];

	// Bindable because the form edits the bag in place — that is the whole job.
	let { params, values = $bindable({}) }: { params: Param[]; values?: Record<string, string> } =
		$props();
</script>

{#if params.length}
	<section>
		{#each params as one (one.name)}
			{#snippet caption()}
				{one.name}{one.required ? ' *' : ''}
				<em>{one.type}{one.note ? ` · ${one.note}` : ''}</em>
			{/snippet}
			<Field label={caption}>
				{#if one.options}
					<Select
						options={[
							{ value: '', label: '—' },
							...one.options.map((choice) => ({ value: choice, label: choice }))
						]}
						value={values[one.name] ?? ''}
						onchange={(e) => (values[one.name] = e.currentTarget.value)}
					/>
				{:else}
					<Input
						placeholder={one.example}
						value={values[one.name] ?? ''}
						oninput={(e) => (values[one.name] = e.currentTarget.value)}
					/>
				{/if}
				{#if one.description}
					<small>{one.description}</small>
				{/if}
			</Field>
		{/each}
	</section>
{/if}

<style>
	section {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
		gap: 0.8em 1em;
		align-items: start;
		margin-bottom: 1.2em;
	}

	em {
		font-style: normal;
		text-transform: none;
		font-family: var(--font-mono);
		font-size: 0.9em;
		color: var(--dim);
	}

	small {
		max-width: 40ch;
		color: var(--muted);
		font-size: 0.75em;
		line-height: 1.4;
		/* Descriptions carry their own newlines, and they are meaningful. */
		white-space: pre-line;
	}
</style>
