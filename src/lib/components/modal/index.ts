import { writable } from 'svelte/store'

export { default as Modal } from './Modal.svelte'
export { default as ModalContainer } from './ModalContainer.svelte'

export const isActive = writable(false)
import type { ComponentProps, Component } from 'svelte'

// type Component = __sveltets_2_IsomorphicComponent | null
// // type Props = Record<string, unknown> | null
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Props = Record<string, any> | null

function createModal() {
  const { subscribe, set } = writable<{
    component: null | Component
    props: null | ComponentProps<Component>
  }>({ component: null, props: null })
  return {
    subscribe,
    set,
    open: <T extends __sveltets_2_IsomorphicComponent>(
      component: T,
      props: Omit<ComponentProps<T>, 'close'> | null = null,
    ) => {
      isActive.set(true)
      modal.set({
        component: component,
        props: props,
      })
    },
    close: () => {
      isActive.set(false)
      modal.set({
        component: null,
        props: null,
      })
    },
  }
}
export const modal = createModal()

export const fadeScale = (
  node: HTMLElement,
  { delay = 0, duration = 200, easing = (x: number) => x, baseScale = 0 },
) => {
  const o = +getComputedStyle(node).opacity
  const m = getComputedStyle(node).transform.match(/scale\(([0-9.]+)\)/)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = m ? m[1] : (1 as any)
  const is = 1 - baseScale

  return {
    delay,
    duration,
    css: (t: number) => {
      const eased = easing(t)
      return `opacity: ${eased * o}; transform: scale(${eased * s * is + baseScale})`
    },
  }
}
