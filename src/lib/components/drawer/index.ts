import { writable } from 'svelte/store'

export { default as DrawerContainer } from './base/DrawerContainer.svelte'

export const isActive = writable(false)
import type { ComponentProps, Component } from 'svelte'

export interface BaseDrawerProps {
  close: () => void
}

function createDrawer() {
  const { subscribe, set } = writable<{
    component: null | Component
    props: null | ComponentProps<Component>
  }>({ component: null, props: null })

  const open = <T extends __sveltets_2_IsomorphicComponent>(
    component: T,
    props: ComponentProps<T> | null = null,
  ) => {
    isActive.set(true)
    set({
      component: component,
      props: props,
    })
  }

  const close = () => {
    isActive.set(false)
    set({
      component: null,
      props: null,
    })
  }

  return {
    subscribe,
    set,
    open,
    close,
  }
}
export const drawer = createDrawer()

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
