import { publicProcedure, router } from '../t'

import { z } from 'zod'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PAGAR_ME_API_KEY, TESTE_PAGAR_ME_API_KEY } from '$env/static/private'

import axios from 'axios'

const encodedKEY = Buffer.from(TESTE_PAGAR_ME_API_KEY).toString('base64')

const address = z.object({
  line_1: z.string(),
  line_2: z.string(),
  zip_code: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
})

const customer = z.object({
  name: z.string(),
  type: z.string(),
  email: z.string(),
  document: z.string(),
  address,
  phones: z.object({
    home_phone: z
      .object({
        country_code: z.string(),
        area_code: z.string(),
        number: z.string(),
      })
      .optional(),
    mobile_phone: z.object({
      country_code: z.string(),
      area_code: z.string(),
      number: z.string(),
    }),
  }),
})

const items = z
  .object({
    amount: z.number(),
    description: z.string(),
    quantity: z.number(),
    code: z.number(),
  })
  .array()

export const pagarme = router({
  cardToken: publicProcedure
    .input(
      z.object({
        closed: z.boolean(),
        customer,
        items,
        payments: z
          .object({
            payment_method: z.string().default('credit_card'),
            credit_card: z.object({
              operation_type: z.string(),
              installments: z.number(),
              statement_descriptor: z.string(),
              card_token: z.string(),
              card: z.object({
                billing_address: address,
              }),
            }),
          })
          .array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(ctx)
      console.log(input)

      console.log(input);
      

      try {
        const { data } = await axios.post(
          'https://api.pagar.me/core/v5/orders',
          {
            "closed": true,
            "customer": {
                "name": "Tony Stark",
                "type": "individual",
                "email": "avengerstark@ligadajustica.com.br",
                "document": "03154435026",
                "address": {
                    "line_1": "7221, Avenida Dra Ruth Cardoso, Pinheiro",
                    "line_2": "Prédio",
                    "zip_code": "05425070",
                    "city": "São Paulo",
                    "state": "SP",
                    "country": "BR"
                },
                "phones": {
                    "home_phone": {
                        "country_code": "55",
                        "area_code": "11",
                        "number": "000000000"
                    },
                    "mobile_phone": {
                        "country_code": "55",
                        "area_code": "11",
                        "number": "000000000"
                    }
                }
            },
            "items": [
                {
                    "amount": 2990,
                    "description": "Chaveiro do Tesseract",
                    "quantity": 1,
                    "code": 123
                }
            ],
            "payments": [
                {
                    "payment_method": "credit_card",
                    "credit_card": {
                        "operation_type": "auth_and_capture",
                        "installments": 1,
                        "statement_descriptor": "AVENGERS", //Máximo de 13 caracteres
                        "card_token": "{{card_token}}",
                        "card": {
                            "billing_address": {
                                "line_1": "7221, Avenida Dra Ruth Cardoso, Pinheiro",
                                "zip_code": "05425070",
                                "city": "São Paulo",
                                "state": "SP",
                                "country": "BR"
                            }
                        }
                    }
                }
            ]
        },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${encodedKEY}`,
            },
          },
        )
        return { data, error: null }
      } catch (error) {
        console.error(error)
        return { data: null, error }
      }
    }),

  pix: publicProcedure
    .input(
      z.object({
        closed: z.boolean(),
        customer,
        items,
        payments: z
          .object({
            amount: z.number(),
            payment_method: z.string().default('pix'),
            pix: z.object({
              expires_in: z.number(),
              additional_information: z.object({
                name: z.string(),
                value: z.string(),
              }),
            }),
          })
          .array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log(ctx)
      console.log(input)
    }),
})
