import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

async function main() {
  const prisma = new PrismaClient({ log: ['error', 'warn'] })

  const email = 'pro@manifest.local'
  const name = 'Pro User'
  const plainPassword = 'ProDemo123!'
  const password = await hashPassword(plainPassword)

  await prisma.user.upsert({
    where: { email },
    update: { name, password, plan: 'pro' },
    create: { email, name, password, plan: 'pro' },
  })

  // Ensure at least one custom category exists for demonstration
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    const demoCategory = 'reminder'
    try {
      await prisma.userCategory.create({ data: { userId: user.id, name: demoCategory } })
    } catch {}
  }

  console.log('\nSeeded Pro user:')
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${plainPassword}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})