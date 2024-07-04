<script>
  import * as m from '$msgs'
</script>

<div
  class="hero min-h-screen"
  style="background-image: url(https://img.daisyui.com/images/stock/photo-1507358522600-9f71e620c44e.jpg);"
>
  <div class="hero-overlay bg-opacity-60"></div>
  <div class="hero-content text-center text-neutral-content">
    <div class="max-w-md">
      <h1 class="mb-5 text-5xl font-bold">{m.hero_title()}</h1>
      <p class="mb-5">
        {m.hero_description()}
      </p>
      <button class="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>
