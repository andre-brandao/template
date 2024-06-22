<script lang="ts" generics="T">
  import type { Snippet } from 'svelte'

  interface CardapioProps {
    data: {
      id: string
      label: string
      row: T[]
    }[]
    card: Snippet<[T]>
  }

  let { data, card }: CardapioProps = $props()

  let selected = $state('')

  let preventSelect = false
  let scrollContainer: HTMLElement
  function changeSelection(new_selection: string) {
    if (preventSelect) {
      return
    }

    selected = new_selection

    const anchor = document.getElementById(`head-${new_selection}`)
    console.log(anchor, scrollContainer)

    if (anchor && scrollContainer) {
      // calculate the position to scroll to
      const scrollPosition =
        anchor.offsetLeft -
        scrollContainer.clientWidth / 2 +
        anchor.clientWidth / 2

      // scroll to the position smoothly
      scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      })
    }
  }
  function scrollIntoView(event: {
    preventDefault: () => void
    currentTarget: HTMLAnchorElement
  }) {
    preventSelect = true
    event.preventDefault()
    const link = event.currentTarget
    const anchorId = new URL(link.href).hash.replace('#', '')
    const anchor = document.getElementById(anchorId)
    anchor?.scrollIntoView({ behavior: 'smooth' })

    selected = anchorId
    setTimeout(() => {
      preventSelect = false
      changeSelection(anchorId)
    }, 1000)
  }

  function onViewportEnter(node: HTMLElement, callback: () => void) {
    const observer = new IntersectionObserver(entries => {
      // Check if the element is intersecting
      if (entries[0].isIntersecting) {
        callback() // Call the provided callback function
        // observer.unobserve(node) // Stop observing the element
      }
    })

    // Observe the node
    observer.observe(node)

    return {
      destroy() {
        observer.disconnect() // Clean up the observer when the element is destroyed
      },
    }
  }
</script>

<main class="mx-1">
  <div class="sticky top-1 mx-2 z-10 pt-2">
    <div
      class="hide-scrollbar flex w-full gap-3 overflow-y-hidden overflow-x-scroll rounded-box bg-base-100 p-2 shadow-xl"
      bind:this={scrollContainer}
    >
      {#each data as d}
        <a
          id="head-{d.id}"
          class="btn hover:translate-y-1 hover:-translate-x-1  {selected === d.id ? 'btn-primary' : 'btn-secondary'}"
          href="#{d.id}"
          onclick={scrollIntoView}
        >
          {d.label}
        </a>
      {/each}
    </div>
  </div>
  {#each data as d}
    <h2
      id={d.id}
      class="mt-4 text-center text-2xl font-bold"
      use:onViewportEnter={() => {
        changeSelection(d.id)
      }}
    >
      {d.label}
    </h2>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-2">
      {#each d.row as row}
        {@render card(row)}
      {/each}
    </div>
  {/each}
</main>

<style>
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
