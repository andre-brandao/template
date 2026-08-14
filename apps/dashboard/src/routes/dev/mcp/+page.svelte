<h1>MCP explorer</h1>
<p class="lede">
	Placeholder. This will list the MCP server's tools with their input schemas and let you call one
	and read the result.
</p>

<h2>What the next pass already knows</h2>
<ul>
	<li>
		Ten tools, all registered in <code>packages/functions/src/mcp/tool/todo.ts</code>. No resources
		and no prompts.
	</li>
	<li>
		They enumerate through <code>client.listTools()</code> over a
		<code>StreamableHTTPClientTransport</code> whose <code>fetch</code> is pointed at
		<code>app.request(...)</code> in-process — the pattern in
		<code>packages/functions/test/mcp.test.ts</code>.
	</li>
	<li>
		<code>authRequired</code> rejects public actors, so a call needs an <code>sk-</code> key or a
		JWT.
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
