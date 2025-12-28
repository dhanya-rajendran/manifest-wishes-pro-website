import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

async function main() {
  const prisma = new PrismaClient({ log: ['error', 'warn'] })

  // Seed subscription plans (Free, Silver, Ultimate)
  const plans = [
    {
      key: 'free',
      name: 'Free',
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      limits: {
        gratitudeEntriesMax: 50,
        tasksMax: 100,
        visionItemsMax: 10,
        method369DailyMax: 9,
      },
      permissions: {
        dashboardAccess: true,
        premiumThemes: false,
        prioritySupport: false,
      },
    },
    {
      key: 'silver',
      name: 'Silver',
      priceMonthlyCents: 299,
      priceYearlyCents: 2999, // discounted yearly
      limits: {
        gratitudeEntriesMax: 500,
        tasksMax: 1000,
        visionItemsMax: 50,
        method369DailyMax: 18,
      },
      permissions: {
        dashboardAccess: true,
        premiumThemes: true,
        prioritySupport: true,
      },
    },
    {
      key: 'ultimate',
      name: 'Ultimate',
      priceMonthlyCents: 1000,
      priceYearlyCents: 9999, // discounted yearly
      limits: {
        gratitudeEntriesMax: -1,
        tasksMax: -1,
        visionItemsMax: -1,
        method369DailyMax: -1,
      },
      permissions: {
        dashboardAccess: true,
        premiumThemes: true,
        prioritySupport: true,
        advancedAnalytics: true,
        integrations: true,
      },
    },
  ]

  for (const plan of plans) {
    await (prisma as any).subscriptionPlan.upsert({
      where: { key: plan.key },
      update: {},
      create: plan,
    })
  }

  // Create Ultimate demo user
  const email = 'ultimate@manifest.local'
  const name = 'Ultimate User'
  const plainPassword = 'UltimateDemo123!'
  const password = await hashPassword(plainPassword)
  const phone = '+15555550100'

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password, plan: 'ultimate', emailVerified: true, phoneVerified: true, phone },
    create: { email, name, password, plan: 'ultimate', emailVerified: true, phoneVerified: true, phone },
  })

  // Attach Ultimate subscription via new table
  const ultimatePlan = await (prisma as any).subscriptionPlan.findUnique({ where: { key: 'ultimate' } })
  if (ultimatePlan) {
    // Ensure only one active subscription
    await (prisma as any).userSubscription.deleteMany({ where: { userId: user.id } })
    await (prisma as any).userSubscription.create({
      data: {
        userId: user.id,
        planId: ultimatePlan.id,
        status: 'active',
      },
    })
  }

  // Ensure at least one custom category exists for demonstration
  const proUser = await prisma.user.findUnique({ where: { email: 'pro@manifest.local' } })
  if (!proUser) {
    const proPass = await hashPassword('ProDemo123!')
    await prisma.user.create({ data: { email: 'pro@manifest.local', name: 'Pro User', password: proPass, plan: 'pro', emailVerified: true } })
  }

  const ultimateUser = await prisma.user.findUnique({ where: { email } })
  if (ultimateUser) {
    const demoCategory = 'reminder'
    try {
      await prisma.userCategory.create({ data: { userId: ultimateUser.id, name: demoCategory } })
    } catch {}
  }

  console.log('\nSeeded Ultimate user:')
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${plainPassword}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})