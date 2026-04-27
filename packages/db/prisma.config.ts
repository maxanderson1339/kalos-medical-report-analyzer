import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dirname, '../../.env') })
config({ path: resolve(import.meta.dirname, '.env') })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
