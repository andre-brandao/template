<script>
  let {
    nome,
    descricao,
    image = 'https://dummyimage.com/420x260',
    ...rest
  } = $props()
</script>

<div class="w-full p-4 md:w-1/2 lg:w-1/4" {...rest}>
  <a class="relative block h-48 overflow-hidden rounded">
    <img
      alt="ecommerce"
      class="block h-full w-full object-cover object-center"
      src={image}
    />
  </a>
  <div class="mt-4">
    <h3 class="title-font mb-1 text-xs tracking-widest">
      {descricao}
    </h3>
    <h2 class="title-font text-lg font-medium text-primary">{nome}</h2>
    <p class="mt-1">R$16.00</p>
  </div>
</div>
