import { faker } from '@faker-js/faker'
import { hash } from '@node-rs/argon2'
import { generateId } from 'lucia'
import fs from 'fs'
import { image, product, user } from './controller'

const TEST_IMAGE = 'src/lib/assets/home/home-open-graph-square.jpg'

const main = async () => {
  await seedUsers()
  await seedBrands()
  await seedCategories()
  await seedProducts()
  await seedProductEntries()
  await seedPrices()
}
main()

async function seedUsers() {
  console.log('userTable seed START')

  try {
    await user.insertUser({
      id: generateId(15),
      username: 'administrator',
      password_hash: await hash('senha123', {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      }),
    })
  } catch (error) {
    console.error('Failed to insert administrator:', error)
  }

  for (let i = 0; i < 20; i++) {
    try {
      await user.insertUser({
        id: generateId(15),
        username: faker.internet.userName(),
        password_hash: await hash('password', {
          memoryCost: 19456,
          timeCost: 2,
          outputLen: 32,
          parallelism: 1,
        }),
      })
    } catch (error) {
      console.error(`Failed to insert user ${i}:`, error)
    }
  }

  console.log('userTable seed END')
}

async function seedBrands() {
  console.log('brandTable seed START')

  for (let i = 0; i < 10; i++) {
    try {
      await product.insertBrand({
        name: faker.company.name(),
      })
    } catch (error) {
      console.error(`Failed to insert brand ${i}:`, error)
    }
  }

  console.log('brandTable seed END')
}

async function seedCategories() {
  console.log('categoryTable seed START')

  for (let i = 0; i < 10; i++) {
    try {
      await product.insertCategory({
        name: faker.commerce.department(),
      })
    } catch (error) {
      console.error(`Failed to insert category ${i}:`, error)
    }
  }

  console.log('categoryTable seed END')
}

async function seedProducts() {
  console.log('productTable seed START')

  for (let i = 0; i < 20; i++) {
    try {
      await product.insertProduct({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
      })
    } catch (error) {
      console.error(`Failed to insert product ${i}:`, error)
    }
  }

  console.log('productTable seed END')
}

async function seedProductEntries() {
  console.log('productEntryTable seed START')

  const products = await product.getProducts()
  const brands = await product.getBrands()
  const categories = await product.getCategories()

  const img_buff = fs.readFileSync(TEST_IMAGE)
  if (!img_buff) {
    console.error('Failed to read test image')
    return
  }

  try {
    const [{ img_id }] = await image.insertImage({
      buff: img_buff,
      name: 'home-open-graph-square.jpg',
      uploaded_by: undefined,
    })

    for (const prod of products) {
      try {
        await product.insertProductEntry({
          product_id: prod.id,
          image_id: img_id,
          brand_id: brands[Math.floor(Math.random() * brands.length)].id,
          category_id:
            categories[Math.floor(Math.random() * categories.length)].id,
          quantity: faker.datatype.number({ min: 1, max: 100 }),
        })
      } catch (error) {
        console.error(
          `Failed to insert product entry for product ${prod.id}:`,
          error,
        )
      }
    }
  } catch (error) {
    console.error('Failed to insert test image:', error)
  }

  console.log('productEntryTable seed END')
}

async function seedPrices() {
  console.log('pricesTable seed START')

  const productEntries = await product.getProductsByCategory()

  for (const entry of productEntries) {
    try {
      const bool = faker.datatype.boolean()
      await product.insertPrices({
        label: bool ? 'wholesale' : 'retail',
        is_retail: bool,
      })

      const prices = await product.getPrices()
      for (const price of prices) {
        try {
          await product.insertProductPrice({
            product_id: entry.id,
            price_id: price.id,
            price: Number(faker.commerce.price()),
          })
        } catch (error) {
          console.error(
            `Failed to insert product price for product entry ${entry.id}:`,
            error,
          )
        }
      }
    } catch (error) {
      console.error(
        `Failed to insert price for product entry ${entry.id}:`,
        error,
      )
    }
  }

  console.log('pricesTable seed END')
}
