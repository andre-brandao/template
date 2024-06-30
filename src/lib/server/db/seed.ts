import {
  userTable,
  productTable,
  productCategoryTable,
  imageTable,
} from './schema'
import { faker } from '@faker-js/faker'
import { hash } from '@node-rs/argon2'
import { generateId } from 'lucia'

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

import { DefaultLogger, type LogWriter } from 'drizzle-orm/logger'

import fs from 'fs'
import sharp from 'sharp'

const TEST_IMAGE = 'src/lib/assets/home/home-open-graph-square.jpg'

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

  const img_buff = fs.readFileSync(TEST_IMAGE)

  if (!img_buff) {
    return
  }

  const processedImage = await sharp(img_buff)
    .resize({ width: 400, height: 400, fit: 'cover' })
    .toBuffer()

  const [{ img_id }] = await db
    .insert(imageTable)
    .values({
      name: 'teste',
      data: processedImage,
      // uploaded_by: user.id,
    })
    .returning({
      img_id: imageTable.id,
    })

  for (let i = 0; i < 15; i++) {
    product_category.push({
      id: i + 1,
      name: faker.commerce.department(),
    })
  }

  console.log('productCategoryTable seed START')
  await db.insert(productCategoryTable).values(product_category)
  console.log('productCategoryTable seed END')
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 10; j++) {
      products.push({
        name: faker.commerce.productName(),
        price: Number(faker.commerce.price()),
        category_id: i + 1,
        description: faker.commerce.productDescription(),
        image_id: img_id,
      })
    }
  }
  console.log('productTable seed START')
  await db.insert(productTable).values(products)
  console.log('productTable seed END')
}
