"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/navbar'
import { Button } from '../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Phone as PhoneIcon } from 'lucide-react'
import { GradientBackground } from '@/components/ui/gradient-background'
import { Card, CardContent } from '../../../components/ui/card'
import { Sparkles, Target, NotebookPen, Star } from 'lucide-react'
import { PhoneInput } from '@/components/ui/base-phone-input'
import { isValidPhoneNumber } from 'react-phone-number-input'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [method, setMethod] = useState<'email' | 'phone'>('email')

  type LoginValues = {
    email: string
    phone: string
    password: string
  }

  const form = useForm<LoginValues>({
    defaultValues: { email: '', phone: '', password: '' },
    mode: 'onBlur',
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      const payload: { email?: string; phone?: string; password: string } = {
        password: values.password,
      }
      if (method === 'email') payload.email = values.email
      else payload.phone = values.phone
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Invalid credentials')
      }
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="grid lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* Left: Stunning info-based hero */}
        <div className="relative hidden lg:block overflow-hidden">
          <GradientBackground
            className="absolute inset-0 from-slate-900 via-purple-900 to-slate-950"
            transition={{ duration: 15, ease: 'easeInOut', repeat: Infinity }}
          />
          <div className="relative z-10 flex h-full items-center justify-center px-10">
            <div className="max-w-xl space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Manifest your best self
              </h1>
              <p className="text-lg text-white/80">
                Visualize goals, journal gratitude, and build habits — a focused space designed to help you show up for what matters.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><Target className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Clarity</h3>
                    <p className="text-sm text-white/80">Vision boards to define and refine intentions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><NotebookPen className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Reflection</h3>
                    <p className="text-sm text-white/80">Quick gratitude journaling to stay present.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><Sparkles className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Momentum</h3>
                    <p className="text-sm text-white/80">Simple routines that stack into long-term results.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"><Star className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold text-white">Focus</h3>
                    <p className="text-sm text-white/80">Distraction-free flow tailored to your goals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Modern login form */}
        <div className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-md border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Welcome back</h2>
                <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              <Form {...form}>
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  {/* Login method tabs styled like Gratitude page, with Lucide icons */}
                  <Tabs
                    defaultValue="email"
                    value={method}
                    onValueChange={(v) => setMethod((v as 'email' | 'phone'))}
                    className="text-sm text-muted-foreground"
                  >
                    <TabsList variant="line" className="w-full gap-0">
                      <TabsTrigger value="email" className="flex-1 justify-center">
                        <Mail className="mr-2 h-4 w-4" /> Email
                      </TabsTrigger>
                      <TabsTrigger value="phone" className="flex-1 justify-center">
                        <PhoneIcon className="mr-2 h-4 w-4" /> Phone
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="email">
                      <FormField
                        control={form.control}
                        name="email"
                        rules={{
                          validate: (v) => (method === 'email' ? (!!v || 'Email is required') : true),
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Email</FormLabel>
                            <FormControl>
                              <input
                                type="email"
                                className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="you@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    <TabsContent value="phone">
                      <FormField
                        control={form.control}
                        name="phone"
                        rules={{
                          validate: (v) =>
                            method === 'phone'
                              ? (v && isValidPhoneNumber(v)) || 'Enter a valid phone number'
                              : true,
                        }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Phone number</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
                                onChange={(val) => field.onChange(val || '')}
                                placeholder="Enter phone number"
                                defaultCountry="US"
                                aria-invalid={!!form.formState.errors.phone}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ required: 'Password is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <input
                            type="password"
                            className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <a className="text-sm underline underline-offset-4" href="/signup">Create account</a>
                  </div>
                  <p className="text-xs text-muted-foreground">Note: Email must be verified to access the dashboard.</p>
                  <Button type="submit" variant="mono" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Loading…' : 'Sign in'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}