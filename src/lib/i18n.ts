// file initialized by the Paraglide-SvelteKit CLI - Feel free to edit it
import { createI18n } from '@inlang/paraglide-sveltekit'
import * as runtime from '$lib/paraglide/runtime.js'

export const i18n = createI18n(runtime, {
  defaultLanguageTag: 'pt',
  //   prefixDefaultLanguage: 'always',
  pathnames: {
    '/admin': {
      en: '/admin',
      pt: '/administrador',
    },
    '/admin/customer': {
      en: '/admin/customer',
      pt: '/administrador/cliente',
    },
    '/admin/customer/[id]': {
      en: '/admin/customer/[id]',
      pt: '/administrador/cliente/[id]',
    },
    '/admin/stock': {
      en: '/admin/stock',
      pt: '/administrador/estoque',
    },
    '/admin/stock/transfer': {
      en: '/admin/stock/transfer',
      pt: '/administrador/estoque/transferir',
    },
    '/admin/stock/transfer/[id]': {
      en: '/admin/stock/transfer/[id]',
      pt: '/administrador/estoque/transferir/[id]',
    },
    // pedidos
    '/admin/orders': {
      en: '/admin/orders',
      pt: '/administrador/pedidos',
    },
    '/admin/orders/[id]': {
      en: '/admin/orders/[id]',
      pt: '/administrador/pedidos/[id]',
    },
    // produtos
    '/admin/products': {
      en: '/admin/products',
      pt: '/administrador/produtos',
    },
    '/admin/products/[id]': {
      en: '/admin/products/[id]',
      pt: '/administrador/produtos/[id]',
    },
  },
})
