<script>
  let { nome, descricao } = $props()
</script>

<button
  class="transistion-transform card w-96 bg-base-100 shadow-xl duration-200 ease-in-out hover:-translate-x-1 hover:-translate-y-1"
>
  <figure>
    <img
      src="https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.jpg"
      alt="Shoes"
    />
  </figure>
  <div class="card-body">
    <h2 class="card-title">
      {nome}
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>{descricao}</p>
    <div class="card-actions justify-end">
      <div class="badge badge-outline">Fashion</div>
      <div class="badge badge-outline">Products</div>
    </div>
  </div>
</button>
