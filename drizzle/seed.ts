/* eslint-disable @typescript-eslint/no-unused-vars */
import { faker } from '@faker-js/faker'
// import faker from "https://cdnjs.cloudflare.com/ajax/libs/Faker/3.1.0/faker.min.js";
import { hash } from '$lib/server/db/user/password'
import { generateId } from 'lucia'
import fs from 'fs'
import { image, product, user } from '$db/controller'

const TEST_IMAGE = 'src/lib/assets/home/home-open-graph-square.jpg'

const main = async () => {
  await seedUsers()
  // await seedCategories()
}
main()

async function seedUsers() {
  console.log('userTable seed START')

  try {
    await user.create({
      id: generateId(15),
      email: 'admin@admin.com',
      username: 'administrator',
      permissions: {
        role: 'admin',
      },
      password_hash: await hash('senha123'),
    })
  } catch (error) {
    console.error('Failed to insert administrator:', error)
  }

  for (let i = 0; i < 20; i++) {
    try {
      await user.create({
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password_hash: await hash('password'),
      })
    } catch (error) {
      console.error(`Failed to insert user ${i}:`, error)
    }
  }

  console.log('userTable seed END')
}

async function seedCategories(quantity = 5) {
  console.log('categoryTable seed START')

  for (let i = 0; i < quantity; i++) {
    try {
      const [cat] = await product
        .insertProductCategory({
          name: faker.commerce.department(),
        })
        .returning()
      await seedProducts(cat.id, i + 1)
    } catch (error) {
      console.error(`Failed to insert category ${i}:`, error)
    }
  }

  console.log('categoryTable seed END')
}

async function seedProducts(category_id: number, quantity = 5) {
  console.log('productTable seed START')

  for (let i = 0; i < quantity; i++) {
    try {
      const [prod] = await product
        .insertProduct({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          category_id: category_id,
        })
        .returning()

      await seedProductItem(prod.id, i + 1)
    } catch (error) {
      console.error(`Failed to insert product ${i}:`, error)
    }
  }

  console.log('productTable seed END')
}

async function seedProductItem(product_id: number, quantity = 2) {
  for (let i = 0; i < quantity; i++) {
    await product.insertProductItem({
      price: faker.number.int({ max: 25000, min: 500 }),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      product_id: product_id,
    })
  }
}
