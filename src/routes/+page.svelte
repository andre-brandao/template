<script>
  import Cardapio from '$lib/components/Cardapio.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import ThemeSwiter from '$lib/components/ThemeSwiter.svelte'
  import Carousel from '$lib/components/landing-page/Carousel.svelte'
  import Carousel2 from '$lib/components/landing-page/Carousel2.svelte'

  let testData = [
    {
      id: '1',
      label: 'Entradas',
      row: [
        {
          id: '1',
          nome: 'Entrada 1',
          descricao: 'Descrição da entrada 1',
        },
        {
          id: '2',
          nome: 'Entrada 2',
          descricao: 'Descrição da entrada 2',
        },
        {
          id: '3',
          nome: 'Entrada 3',
          descricao: 'Descrição da entrada 3',
        },
      ],
    },
    {
      id: '2',
      label: 'Pratos Principais',
      row: [
        {
          id: '4',
          nome: 'Prato Principal 1',
          descricao: 'Descrição do prato principal 1',
        },
        {
          id: '5',
          nome: 'Prato Principal 2',
          descricao: 'Descrição do prato principal 2',
        },
        {
          id: '6',
          nome: 'Prato Principal 3',
          descricao: 'Descrição do prato principal 3',
        },
      ],
    },
    {
      id: '3',
      label: 'Sobremesas',
      row: [
        {
          id: '7',
          nome: 'Sobremesa 1',
          descricao: 'Descrição da sobremesa 1',
        },
        {
          id: '8',
          nome: 'Sobremesa 2',
          descricao: 'Descrição da sobremesa 2',
        },
        {
          id: '9',
          nome: 'Sobremesa 3',
          descricao: 'Descrição da sobremesa 3',
        },
      ],
    },
    {
      id: '4',
      label: 'Bebidas',
      row: [
        {
          id: '10',
          nome: 'Bebida 1',
          descricao: 'Descrição da bebida 1',
        },
        {
          id: '11',
          nome: 'Bebida 2',
          descricao: 'Descrição da bebida 2',
        },
        {
          id: '12',
          nome: 'Bebida 3',
          descricao: 'Descrição da bebida 3',
        },
      ],
    },
    {
      id: '5',
      label: 'Bebidas',
      row: [
        {
          id: '13',
          nome: 'Bebida 4',
          descricao: 'Descrição da bebida 4',
        },
        {
          id: '14',
          nome: 'Bebida 5',
          descricao: 'Descrição da bebida 5',
        },
        {
          id: '15',
          nome: 'Bebida 6',
          descricao: 'Descrição da bebida 6',
        },
      ],
    },
    {
      id: '6',
      label: 'Bebidas',
      row: [
        {
          id: '16',
          nome: 'Bebida 7',
          descricao: 'Descrição da bebida 7',
        },
        {
          id: '17',
          nome: 'Bebida 8',
          descricao: 'Descrição da bebida 8',
        },
        {
          id: '18',
          nome: 'Bebida 9',
          descricao: 'Descrição da bebida 9',
        },
      ],
    },
    {
      id: '7',
      label: 'Bebidas',
      row: [
        {
          id: '19',
          nome: 'Bebida 10',
          descricao: 'Descrição da bebida 10',
        },
        {
          id: '20',
          nome: 'Bebida 11',
          descricao: 'Descrição da bebida 11',
        },
        {
          id: '21',
          nome: 'Bebida 12',
          descricao: 'Descrição da bebida 12',
        },
      ],
    },
    {
      id: '8',
      label: 'Bebidas',
      row: [
        {
          id: '22',
          nome: 'Bebida 13',
          descricao: 'Descrição da bebida 13',
        },
        {
          id: '23',
          nome: 'Bebida 14',
          descricao: 'Descrição da bebida 14',
        },
        {
          id: '24',
          nome: 'Bebida 15',
          descricao: 'Descrição da bebida 15',
        },
      ],
    },
    {
      id: '9',
      label: 'Bebidas',
      row: [
        {
          id: '25',
          nome: 'Bebida 16',
          descricao: 'Descrição da bebida 16',
        },
        {
          id: '26',
          nome: 'Bebida 17',
          descricao: 'Descrição da bebida 17',
        },
        {
          id: '27',
          nome: 'Bebida 18',
          descricao: 'Descrição da bebida 18',
        },
      ],
    },
    {
      id: '10',
      label: 'Bebidas',
      row: [
        {
          id: '28',
          nome: 'Bebida 19',
          descricao: 'Descrição da bebida 19',
        },
        {
          id: '29',
          nome: 'Bebida 20',
          descricao: 'Descrição da bebida 20',
        },
        {
          id: '30',
          nome: 'Bebida 21',
          descricao: 'Descrição da bebida 21',
        },
      ],
    },
    {
      id: '11',
      label: 'Bebidas',
      row: [
        {
          id: '31',
          nome: 'Bebida 22',
          descricao: 'Descrição da bebida 22',
        },
        {
          id: '32',
          nome: 'Bebida 23',
          descricao: 'Descrição da bebida 23',
        },
        {
          id: '33',
          nome: 'Bebida 24',
          descricao: 'Descrição da bebida 24',
        },
      ],
    },
  ]
</script>

<!-- 
<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

<Modal onClose={console.log} onOpen={console.log}>Teste Modal</Modal> -->

<Carousel />

<Carousel2 />

<Cardapio data={testData}>
  {#snippet card(d)}
    <div class="card w-96 bg-base-100 shadow-xl">
      <figure>
        <img
          src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
          alt="Shoes"
        />
      </figure>
      <div class="card-body">
        <h2 class="card-title">
          {d.nome}
          <div class="badge badge-secondary">NEW</div>
        </h2>
        <p>{d.descricao}</p>
        <div class="card-actions justify-end">
          <div class="badge badge-outline">Fashion</div>
          <div class="badge badge-outline">Products</div>
        </div>
      </div>
    </div>
  {/snippet}
</Cardapio>
