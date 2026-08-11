<script lang="ts">
	import { Themes, type Prefs } from '@template/core/user/prefs';

	let { value, onpick }: { value: Prefs['theme']; onpick: (theme: Prefs['theme']) => void } =
		$props();

	const labels = { system: 'System settings', light: 'Light', dark: 'Dark' };
</script>

<div class="cards" role="radiogroup" aria-label="Appearance">
	{#each Themes as theme (theme)}
		<label class="card" class:on={value === theme}>
			<input
				type="radio"
				name="theme"
				value={theme}
				checked={value === theme}
				onchange={() => onpick(theme)}
			/>
			<!-- Swatches use fixed colours, never tokens: the Light card has to look light
			     while the app around it is still dark. -->
			<span class="preview {theme}">
				<span class="bar"></span>
				<span class="line"></span>
				<span class="line short"></span>
			</span>
			<span class="label">{labels[theme]}</span>
		</label>
	{/each}
</div>

<style>
	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75em;
	}

	.card {
		position: relative;
		flex: 1 1 8em;
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		padding: 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		cursor: pointer;
	}

	.card:hover {
		border-color: var(--border-bright);
	}

	.card.on {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}

	/* Invisible but still the click target — it covers the whole card so pointer
	   input (and Playwright) lands on the control itself, not the swatch above it. */
	input {
		position: absolute;
		inset: 0;
		opacity: 0;
		margin: 0;
		cursor: pointer;
	}

	.preview {
		display: flex;
		flex-direction: column;
		gap: 4px;
		height: 3.4em;
		padding: 0.5em;
		border-radius: 5px;
		overflow: hidden;
	}

	.preview.light {
		background: #ffffff;
		border: 1px solid #dedbd4;
	}

	.preview.dark {
		background: #17181a;
		border: 1px solid #2e3033;
	}

	/* Split down the middle — the same trick Twenty uses for its System card. */
	.preview.system {
		background: linear-gradient(to right, #ffffff 0 50%, #17181a 50% 100%);
		border: 1px solid #8b8a84;
	}

	.bar {
		height: 6px;
		border-radius: 2px;
		background: #4fa98f;
		width: 45%;
	}

	.line {
		height: 4px;
		border-radius: 2px;
		background: #8b8a84;
	}

	.line.short {
		width: 60%;
	}

	.label {
		font-size: 0.82em;
		color: var(--muted);
	}

	.card.on .label {
		color: var(--ink);
	}

	input:focus-visible + .preview {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
