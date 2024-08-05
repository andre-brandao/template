<script>
    let logo = 'src/lib/assets/home/logo-duarte.jpg'
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center">
	<img src={logo} alt="Logo" class="mb-3 max-h-60 max-w-60" />
	<h1 class="mb-4 text-4xl font-bold text-center">Bem-vindo ao Sistema do Duarte</h1>
	<div class="flex flex-col lg:flex-row gap-4">
		<a
			href="/"
			class="rounded-lg bg-primary px-6 py-2 hover:bg-opacity-75 text-center transition"
			>Faça seu pedido!</a
		>
		<a
			href="/admin"
			class="rounded-lg bg-primary px-6 py-2 hover:bg-opacity-75 text-center transition"
			>Administrador? Faça o Login</a
		>
	</div>
</div>
