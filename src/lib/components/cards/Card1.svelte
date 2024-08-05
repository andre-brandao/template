<script lang="ts">
  interface CardProps {
    nome: string
    descricao: string
    image?: string
    preco: string
  }

  let categorias = [{ nome: 'Latao' }, { nome: 'Teste' }]
  let { nome, descricao, image, preco }: CardProps = $props()
</script>

<button
  class="transistion-transform card w-80 bg-base-100 shadow-xl duration-200 ease-in-out hover:-translate-x-1 hover:-translate-y-1"
>
  <figure>
    <img
      src={image
        ? image
        : 'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg'}
      loading="lazy"
      alt={nome}
    />
  </figure>
  <div class="card-body">
    <h2 class="card-title flex justify-center">
      {nome}
      <div class="badge badge-primary items-center p-4">
        <p class="text-center text-xl">R${preco}</p>
      </div>
    </h2>
    <p class="text-sm">Descricão: {descricao}</p>
    <div class="card-actions justify-center">
      {#each categorias as categoria}
        <div class="badge badge-outline">{categoria.nome}</div>
      {/each}
    </div>
  </div>
</button>
