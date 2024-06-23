<script>
  import DnDContainer from '$lib/dnd/DnDContainer.svelte'

  let containers = [
    {
      id: '1',
      label: 'Entradas',
      isDraggingOver: false,
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
      isDraggingOver: false,
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
      isDraggingOver: false,
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
  ]
</script>

<DnDContainer {containers}>
  {#snippet card(c)}
   
  <div class='bg-red-50 w-full'>
    <p>
      {c.nome}

    </p>
    <p>
      {c.descricao}
    </p>
  </div>
  {/snippet}
</DnDContainer>
