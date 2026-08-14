<h1>API explorer</h1>
<p class="lede">
	Placeholder. This will browse the api service's OpenAPI surface and fire authenticated requests
	at it from the browser.
</p>

<h2>What the next pass already knows</h2>
<ul>
	<li>
		The spec is generated offline into <code>packages/sdk/openapi.json</code> by
		<code>packages/functions/scripts/gen-spec.ts</code> — the api serves no
		<code>/openapi.json</code> of its own.
	</li>
	<li>
		<code>src/lib/server/api.ts</code> already shows the in-process call: a
		<code>TemplateSdk</code> over <code>app.fetch</code>, authenticated with an
		<code>sk-</code> key. It is otherwise unused.
	</li>
	<li>
		Surface today: <code>/me</code>, <code>/key</code>, <code>/todo</code>,
		<code>/project</code>, <code>/file</code>.
	</li>
</ul>

<style>
	h1 {
		margin: 0 0 0.3em;
		font-size: 1.5em;
	}

	.lede {
		margin: 0 0 2em;
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.9em;
	}

	h2 {
		margin: 0 0 0.7em;
		font-family: var(--font-mono);
		font-size: 0.7em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	ul {
		max-width: 70ch;
		margin: 0;
		padding-left: 1.2em;
		color: var(--muted);
		font-size: 0.88em;
		line-height: 1.7;
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
		color: var(--ink);
	}
</style>
