"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/base-input'
import dynamic from 'next/dynamic'
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxInput as ComboInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxIcon,
  ComboboxClear,
} from '@/components/ui/base-combobox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker/default'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import AvatarUpload from '@/components/file-upload/avatar-upload'

// Move static option arrays to module scope to avoid re-creating on each render
const GOAL_OPTIONS = [
  'Working on better focus and discipline',
  'Aiming to improve my confidence',
  'Learning consistency and positive habits',
  'Focused on growth and self-improvement',
  'Building healthy routines',
  'Improving time management',
  'Practicing mindfulness',
  'Enhancing productivity',
  'Strengthening resilience',
  'Developing leadership skills',
  'Advancing my career',
  'Improving communication',
  'Cultivating gratitude',
] as const
const INTEREST_OPTIONS = [
  'Music',
  'Sports',
  'Art',
  'Coding',
  'Reading',
  'Writing',
  'Photography',
  'Travel',
  'Cooking',
  'Movies',
  'Science',
  'Technology',
  'Gardening',
] as const
const HOBBY_OPTIONS = [
  'Drawing',
  'Gaming',
  'Journaling',
  'Studying',
  'Fitness',
  'Hiking',
  'Cycling',
  'Yoga',
  'Meditation',
  'DIY crafts',
  'Baking',
] as const

// Lazy-load heavy client-only components to reduce initial bundle and render cost
const PhoneInput = dynamic(() => import('@/components/ui/base-phone-input').then((m) => m.PhoneInput), { ssr: false })

type ProfileData = {
  user: { email: string; phone: string | null; gender: string | null; plan: string }
  profile: { dob?: string | null; profileImageUrl?: string | null; bio?: string | null; timezone?: string | null } | null
}

export default function ProfilePage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [base, setBase] = useState<ProfileData | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Local states for new fields
  const [phone, setPhone] = useState<string | null>(null)
  const [goals, setGoals] = useState<string[]>([])
  const [goalsDate, setGoalsDate] = useState<string | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [hobbies, setHobbies] = useState<string[]>([])

  // Refs to align combobox dropdowns with chips container
  const goalsChipsRef = useRef<HTMLDivElement | null>(null)
  const interestsChipsRef = useRef<HTMLDivElement | null>(null)
  const hobbiesChipsRef = useRef<HTMLDivElement | null>(null)

  // Memoize change handlers to reduce re-renders of child components
  const onGoalsChange = useCallback((vals: unknown) => setGoals((vals as string[]) ?? []), [])
  const onInterestsChange = useCallback((vals: unknown) => setInterests((vals as string[]) ?? []), [])
  const onHobbiesChange = useCallback((vals: unknown) => setHobbies((vals as string[]) ?? []), [])

  const form = useForm<{ gender: string | null; dob: string | null; profileImageUrl: string | null; bio: string | null; timezone: string | null }>({
    defaultValues: { gender: null, dob: null, profileImageUrl: null, bio: null, timezone: null },
    mode: 'onBlur',
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'include' })
        const ct = res.headers.get('content-type') || ''
        let data: any = null
        if (ct.includes('application/json')) {
          data = await res.json()
        } else {
          const text = await res.text()
          throw new Error(text || 'Failed to load profile')
        }
        if (!res.ok) throw new Error(data?.error || 'Failed to load profile')
        setBase(data)
        setPhone(data.user.phone ?? null)
        // Attempt to parse structured extras from bio if JSON
        let extras: any = null
        try {
          extras = data.profile?.bio ? JSON.parse(data.profile.bio) : null
        } catch {
          extras = null
        }
        form.reset({
          gender: data.user.gender ?? null,
          dob: data.profile?.dob ?? null,
          profileImageUrl: data.profile?.profileImageUrl ?? null,
          bio: extras?.bioText ?? data.profile?.bio ?? null,
          timezone: data.profile?.timezone ?? null,
        })
        setAvatarUrl(data.profile?.profileImageUrl ?? null)
        setGoals(Array.isArray(extras?.goals) ? extras.goals : [])
        setGoalsDate(extras?.goalsTargetDate ?? null)
        setInterests(Array.isArray(extras?.interests) ? extras.interests : [])
        setHobbies(Array.isArray(extras?.hobbies) ? extras.hobbies : [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = form.handleSubmit(async (values) => {
    setError('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          phone,
          goals,
          goalsTargetDate: goalsDate,
          interests,
          hobbies,
        }),
        credentials: 'include',
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to save')
      } else {
        const text = await res.text()
        throw new Error(text || 'Failed to save')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    }
  })

  async function handleAvatarFileChange(file: { file: File | any } | null) {
    if (!file || !(file.file instanceof File)) return
    setError('')
    const fd = new FormData()
    fd.append('file', file.file)
    try {
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd, credentials: 'include' })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to upload avatar')
        const url: string | undefined = data?.url
        if (url) {
          setAvatarUrl(url)
          form.setValue('profileImageUrl', url, { shouldDirty: true })
        }
      } else {
        const text = await res.text()
        throw new Error(text || 'Failed to upload avatar')
      }
    } catch (e: any) {
      setError(e?.message || 'Avatar upload failed')
    }
  }

  async function handleResetPassword(currentPassword: string, newPassword: string) {
    setError('')
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to reset password')
      } else {
        const text = await res.text()
        throw new Error(text || 'Failed to reset password')
      }
      alert('Password updated')
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-10">
        <Card className="w-full max-w-none border bg-card shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <AvatarUpload defaultAvatar={avatarUrl ?? undefined} onFileChange={handleAvatarFileChange} maxSize={2 * 1024 * 1024} />
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-2 h-9 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-2 h-9 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="mt-2 h-9 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-9 w-full" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-24 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input className="mt-1 w-full" value={base?.user.email ?? ''} disabled aria-readonly />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <div className="mt-1">
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={phone ?? ''}
                        onChange={(val) => setPhone(typeof val === 'string' ? val : val || null)}
                      />
                    </div>
                  </div>
                </div>
                <Form {...form}>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Gender</FormLabel>
                            <FormControl>
                              <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Prefer not to say" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="nonbinary">Non-binary</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Date of Birth</FormLabel>
                            <FormControl>
                              <div className="mt-1">
                                <DatePicker
                                  value={field.value ? new Date(field.value) : undefined}
                                  onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : null)}
                                  placeholder="Select date of birth"
                                  className="relative w-full"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Goals / Aspirations with target date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <FormLabel className="text-sm">Goals / Aspirations</FormLabel>
                        <Combobox multiple items={GOAL_OPTIONS} value={goals} onValueChange={onGoalsChange}>
                          <ComboboxChips ref={goalsChipsRef}>
                          {goals.map((g) => (
                              <ComboboxChip key={g}>
                                {g}
                                <ComboboxChipRemove />
                              </ComboboxChip>
                            ))}
                            <ComboInput placeholder="Search or add goals" />
                            <ComboboxIcon />
                            <ComboboxClear />
                          </ComboboxChips>
                          <ComboboxContent anchor={goalsChipsRef}>
                            <ComboboxList>
                              {GOAL_OPTIONS.map((opt) => (
                                <ComboboxItem key={opt} value={opt}>
                                  <ComboboxItemIndicator />
                                  {opt}
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                      <div>
                        <FormLabel className="text-sm">Target date</FormLabel>
                        <div className="mt-1">
                          <DatePicker
                            value={goalsDate ? new Date(goalsDate) : undefined}
                            onChange={(d) => setGoalsDate(d ? format(d, 'yyyy-MM-dd') : null)}
                            placeholder="Select target date"
                            className="relative w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interests */}
                    <div className="space-y-1">
                      <FormLabel className="text-sm">Interests</FormLabel>
                      <Combobox multiple items={INTEREST_OPTIONS} value={interests} onValueChange={onInterestsChange}>
                        <ComboboxChips ref={interestsChipsRef}>
                          {interests.map((i) => (
                            <ComboboxChip key={i}>
                              {i}
                              <ComboboxChipRemove />
                            </ComboboxChip>
                          ))}
                          <ComboInput placeholder="Search or add interests" />
                          <ComboboxIcon />
                          <ComboboxClear />
                        </ComboboxChips>
                        <ComboboxContent anchor={interestsChipsRef}>
                          <ComboboxList>
                            {INTEREST_OPTIONS.map((opt) => (
                              <ComboboxItem key={opt} value={opt}>
                                <ComboboxItemIndicator />
                                {opt}
                              </ComboboxItem>
                            ))}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>

                    {/* Hobbies */}
                    <div className="space-y-1">
                      <FormLabel className="text-sm">Hobbies</FormLabel>
                      <Combobox multiple items={HOBBY_OPTIONS} value={hobbies} onValueChange={onHobbiesChange}>
                        <ComboboxChips ref={hobbiesChipsRef}>
                          {hobbies.map((h) => (
                            <ComboboxChip key={h}>
                              {h}
                              <ComboboxChipRemove />
                            </ComboboxChip>
                          ))}
                          <ComboInput placeholder="Search or add hobbies" />
                          <ComboboxIcon />
                          <ComboboxClear />
                        </ComboboxChips>
                        <ComboboxContent anchor={hobbiesChipsRef}>
                          <ComboboxList>
                            {HOBBY_OPTIONS.map((opt) => (
                              <ComboboxItem key={opt} value={opt}>
                                <ComboboxItemIndicator />
                                {opt}
                              </ComboboxItem>
                            ))}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </div>
                    <FormField
                      control={form.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Profile Picture URL</FormLabel>
                          <FormControl>
                            <input
                              type="url"
                              className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="https://..."
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Bio</FormLabel>
                          <FormControl>
                            <textarea
                              className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              rows={3}
                              placeholder="Tell us a bit about yourself"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Timezone</FormLabel>
                          <FormControl>
                            <input
                              type="text"
                              className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="e.g. America/Los_Angeles"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="primary" className="w-full">Save changes</Button>
                  </form>
                </Form>

                <div className="border-t pt-4 space-y-2">
                  <h2 className="text-lg font-semibold">Reset Password</h2>
                  <ResetPassword onReset={handleResetPassword} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function ResetPassword({ onReset }: { onReset: (currentPassword: string, newPassword: string) => Promise<void> }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    if (!current || !next || !confirm) return setErr('All fields are required')
    if (next !== confirm) return setErr('New passwords do not match')
    await onReset(current, next)
    setCurrent(''); setNext(''); setConfirm('')
  }

  return (
    <div className="space-y-2">
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          type="password"
          placeholder="Current password"
          className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <input
          type="password"
          placeholder="New password"
          className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          className="mt-1 w-full rounded-lg border bg-background/50 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <Button variant="primary" onClick={submit}>Update password</Button>
    </div>
  )
}