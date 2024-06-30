import { userTable, productTable, productCategoryTable } from './schema'
import { faker } from '@faker-js/faker'
import { hash } from '@node-rs/argon2'
import { generateId } from 'lucia'

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger'

class MyLogWriter implements LogWriter {
  write(message: string) {
    console.log(message)
  }
}
const logger = new DefaultLogger({ writer: new MyLogWriter() })
 const libsqlClient = createClient({
  url: 'file:local.db',
})

const db = drizzle(libsqlClient, { logger })

const main = async () => {
  await seedUsers()
  await seedProducts()
}
main()

async function seedUsers() {
  const users: (typeof userTable.$inferInsert)[] = []

  for (let i = 0; i < 20; i++) {
    users.push({
      id: generateId(15),
      username: faker.internet.userName(),
      password_hash: await hash('password', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      }),
    })
  }

  console.log('userTable seed START')
  await db.insert(userTable).values(users)
  console.log('userTable seed END')
}

async function seedProducts() {
  const product_category: (typeof productCategoryTable.$inferInsert)[] = []
  const products: (typeof productTable.$inferInsert)[] = []

  for (let i = 0; i < 20; i++) {
    product_category.push({
      id: i + 1,
      name: faker.commerce.department(),
    })
  }

  console.log('productCategoryTable seed START')
  await db.insert(productCategoryTable).values(product_category)
  console.log('productCategoryTable seed END')
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      products.push({
        name: faker.commerce.productName(),
        price: Number(faker.commerce.price()),
        category_id: i + 1,
        description: faker.commerce.productDescription(),
        image: faker.image.imageUrl(),
      })
    }
  }
  console.log('productTable seed START')
  await db.insert(productTable).values(products)
  console.log('productTable seed END')
}
