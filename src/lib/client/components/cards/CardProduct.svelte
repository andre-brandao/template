<script lang="ts">
  import { Motion, useMotionTemplate, useMotionValue } from 'svelte-motion'
  let mouseX = useMotionValue(0)
  let mouseY = useMotionValue(0)
  let background = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(51, 51, 51, 0.4), transparent 80%)`

  interface CardProps {
    nome: string
    descricao: string
    image?: string
  }
  let { nome, descricao, image }: CardProps = $props()
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  onmousemove={e => {
    const { left, top } = e.currentTarget.getBoundingClientRect()

    mouseX.set(e.clientX - left)
    mouseY.set(e.clientY - top)
  }}
  class="group relative w-full max-w-[350px] overflow-hidden rounded-xl bg-neutral-950"
>
  <div
    class="absolute right-5 top-0 h-px w-80 bg-gradient-to-l from-transparent via-white/30 via-10% to-transparent"
  ></div>
  <Motion
    style={{
      background,
    }}
    let:motion
  >
    <div
      use:motion
      class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
    ></div>
  </Motion>
  <div
    class="relative flex flex-col gap-3 rounded-xl border border-white/10 px-4 py-5"
  >
    <div class="space-y-2">
      <img
        src={image
          ? image
          : 'https://i.pinimg.com/564x/c3/5c/30/c35c30d5bb21d2392c3daa0abd8a5440.jpg'}
        alt="Product image of {nome}"
        height={10}
        width={10}
        class="h-52 w-full rounded-xl object-cover opacity-75"
      />
      <div class="flex flex-row items-center justify-between pt-2">
        <h3 class="text-xl font-semibold text-neutral-200">{nome}</h3>
        <p class="select-none text-[13px] text-neutral-300">$249.00</p>
      </div>
      <p class="pb-3 text-sm leading-[1.5] text-neutral-400">
        {descricao}
      </p>
      <button
        class="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black duration-300 hover:bg-white/70"
      >
        Sponsor Now
      </button>
    </div>
  </div>
</div>
