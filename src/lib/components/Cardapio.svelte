<script lang="ts" generics="T">
  import type { Snippet } from 'svelte'

  interface CardapioProps {
    data: {
      id: any
      name: string
      products: T[]
    }[]
    card: Snippet<[T]>
  }

  // interface CardapioProps {
  //   data: Record<string, T[]>
  //   card: (row: T) => any
  // }
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
  let timeoutId: NodeJS.Timeout | null = null

  function scrollIntoView(event: {
    preventDefault: () => void
    currentTarget: HTMLAnchorElement
  }) {
    preventSelect = true
    event.preventDefault()
    const link = event.currentTarget
    const anchorId = new URL(link.href).hash.replace('#', '')
    const anchor = document.getElementById(anchorId)
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    selected = anchorId

    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      preventSelect = false
      // changeSelection(anchorId)
      timeoutId = null // Reset the timeout ID
    }, 2000)
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
  <div class="sticky top-1 z-10 mx-2 pt-2">
    <div
      class="hide-scrollbar flex w-full gap-3 overflow-y-hidden overflow-x-scroll rounded-box bg-base-200 p-2 shadow-xl"
      bind:this={scrollContainer}
    >
      {#each data as d}
        <a
          id="head-{d}"
          class="btn hover:translate-y-0.5 {selected === d.id
            ? 'bg-primary'
            : 'bg-base-100'}"
          href="#{d.id}"
          onclick={scrollIntoView}
        >
          {d.name}
        </a>
      {/each}
    </div>
  </div>
  <div class=" container mx-auto flex flex-col gap-3">
    {#each data as d}
      <div class="flex flex-col">
        <div
          id={d.id}
          class="divider my-4 py-4 text-center text-2xl font-bold"
          use:onViewportEnter={() => {
            changeSelection(d.id)
          }}
        >
          {d.name}
        </div>
        <div class=" flex flex-wrap justify-around gap-4">
          {#each d.products as row}
            {@render card(row)}
          {/each}
        </div>
      </div>
    {/each}
  </div>
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
