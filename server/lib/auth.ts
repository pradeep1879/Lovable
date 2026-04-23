import dotenv from 'dotenv'
dotenv.config()
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { betterAuth } from 'better-auth'
import { prisma } from '../prisma/db'

const trustedOrigins = process.env.TRUSTEDORIGINS?.split(',') || ['http://localhost:5173']

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled:true,
  },
  user: {
    deleteUser: {enabled: true}
  },
  trustedOrigins,
  baseURL: process.env.BETTER_AUTH_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,
  advanced: {
    cookies: {
      session_token: {
        name: "better-auth",
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/'
        }
      }
    }
  }
})