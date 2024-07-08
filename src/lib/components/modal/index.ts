import { writable } from 'svelte/store'

export { default as Modal } from './base/Modal.svelte'
export { default as ModalContainer } from './base/ModalContainer.svelte'
export { default as FormModal } from './FormModal.svelte'

import Alert from './base/Alert.svelte'

export const isActive = writable(false)
import type { ComponentProps, Component } from 'svelte'

export interface BaseModalProps {
  close: () => void
}

function createModal() {
  const { subscribe, set } = writable<{
    component: null | Component
    props: null | ComponentProps<Component>
  }>({ component: null, props: null })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const open = <T extends Component<any, object, string>>(
    component: T,
    props: ComponentProps<T> | null = null,
  ) => {
    isActive.set(true)
    set({
      component,
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

  const alert = (args: ComponentProps<Alert>) => {
    open(Alert, args)
  }
  return {
    subscribe,
    set,
    open,
    alert,
    close,
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
