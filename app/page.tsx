import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { Button } from '../components/ui/button'
import { GridBackground } from '@/components/ui/grid-background'
import { TypingText } from '@/components/ui/typing-text'
import { Sparkles, Target, NotebookPen, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Marquee } from '@/components/ui/marquee'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Full-width hero section */}
      <section className="w-full">
        <div className="relative h-[560px] w-full overflow-hidden">
          <GridBackground
            gridSize="6:6"
            // colors={{
            //   background: 'bg-gradient-to-br from-[#166434] via-[#0f3e1f] to-[#07150b]',
            //   borderColor: 'border-[#166434]/30',
            //   borderSize: '2px',
            //   borderStyle: 'solid',
            // }}
            // beams={{
            //   count: 8,
            //   colors: ['bg-[#166434]', 'bg-[#2b8a50]', 'bg-[#0f3e1f]', 'bg-[#1f7a43]', 'bg-[#0b2d17]'],
            //   speed: 5,
            //   shadow: 'shadow-lg shadow-current/60',
            // }}
          >
            <div className="flex flex-col items-center justify-center max-w-5xl mx-auto space-y-8 h-full px-8">
              <h1 className="text-center text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                <TypingText
                  text="Manifest a more intentional life."
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  speed={300}
                  delay={300}
                  showCursor={true}
                  cursor="|"
                  cursorClassName="text-accent"
                />
              </h1>
              <p className="text-center text-lg text-white max-w-2xl">
                Visualize goals, journal gratitude, and build habits — beautifully synced with your Chrome extension.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="ghost" className="bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground hover:shadow-lg w-40">
                  Get Started
                </Button>
                <Button size="lg" variant="ghost" className="bg-secondary hover:bg-secondary text-secondary-foreground hover:text-secondary-foreground hover:shadow-lg w-40">
                  Learn More
                </Button>
              </div>
            </div>
          </GridBackground>
        </div>
      </section>
      <main className="mx-auto max-w-6xl px-4 py-16">
        

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Vision Boards</h3>
            <p className="text-sm text-muted-foreground mt-2">Organize images and notes that inspire you.</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Gratitude Journal</h3>
            <p className="text-sm text-muted-foreground mt-2">Capture daily moments of appreciation.</p>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Tasks & Habits</h3>
            <p className="text-sm text-muted-foreground mt-2">Stay on track with simple routines.</p>
          </div>
        </section>

        <section className="mt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Why Manifest Wishes Pro</h2>
            <p className="mt-3 text-muted-foreground">A focused, delightful space designed to help you show up for your goals—consistently.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Target className="h-4 w-4" /></span>
                <h3 className="font-semibold">Clarity</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Define intentions with vision boards and track progress without distractions.</p>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent"><NotebookPen className="h-4 w-4" /></span>
                <h3 className="font-semibold">Reflection</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Build gratitude with quick journaling to stay motivated and present.</p>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-secondary"><Sparkles className="h-4 w-4" /></span>
                <h3 className="font-semibold">Momentum</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Simple habits and tasks that build up into long-term results.</p>
            </div>
          </div>
        </section>

        <section className="mt-24 px-0">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold">Manifestation Stories</h2>
            <p className="mt-3 text-gray-700">Real people, real changes. A few words from our community.</p>
          </div>

          {/* Testimonials marquee */}
          <div className="mt-8">
            {(() => {
              const testimonials = [
                { name: 'Ava Green', username: '@ava', body: 'Cascade AI made my workflow 10x faster!', img: 'https://randomuser.me/api/portraits/women/32.jpg', country: '🇦🇺 Australia' },
                { name: 'Ana Miller', username: '@ana', body: 'Vertical marquee is a game changer!', img: 'https://randomuser.me/api/portraits/women/68.jpg', country: '🇩🇪 Germany' },
                { name: 'Mateo Rossi', username: '@mat', body: 'Animations are buttery smooth!', img: 'https://randomuser.me/api/portraits/men/51.jpg', country: '🇮🇹 Italy' },
                { name: 'Maya Patel', username: '@maya', body: 'Setup was a breeze!', img: 'https://randomuser.me/api/portraits/women/53.jpg', country: '🇮🇳 India' },
                { name: 'Noah Smith', username: '@noah', body: 'Best marquee component!', img: 'https://randomuser.me/api/portraits/men/33.jpg', country: '🇺🇸 USA' },
                { name: 'Lucas Stone', username: '@luc', body: 'Very customizable and smooth.', img: 'https://randomuser.me/api/portraits/men/22.jpg', country: '🇫🇷 France' },
                { name: 'Haruto Sato', username: '@haru', body: 'Impressive performance on mobile!', img: 'https://randomuser.me/api/portraits/men/85.jpg', country: '🇯🇵 Japan' },
                { name: 'Emma Lee', username: '@emma', body: 'Love the pause on hover feature!', img: 'https://randomuser.me/api/portraits/women/45.jpg', country: '🇨🇦 Canada' },
                { name: 'Carlos Ray', username: '@carl', body: 'Great for testimonials and logos.', img: 'https://randomuser.me/api/portraits/men/61.jpg', country: '🇪🇸 Spain' },
              ];

              function TestimonialCard({ img, name, username, body, country }: (typeof testimonials)[number]) {
                return (
                  <Card className="w-64">
                    <CardContent className="p-4 text-foreground">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-9">
                          <AvatarImage src={img} alt={name} />
                          <AvatarFallback>{name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <figcaption className="text-sm font-medium text-foreground flex items-center gap-1">
                            {name} <span className="text-xs">{country}</span>
                          </figcaption>
                          <p className="text-xs font-medium text-muted-foreground">{username}</p>
                        </div>
                      </div>
                      <blockquote className="mt-3 text-sm text-foreground">{body}</blockquote>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="relative flex w-screen flex-col items-center justify-center gap-1 overflow-hidden py-8 -mx-[calc((100vw-100%)/2)]">
                  <Marquee pauseOnHover repeat={3} className="[--duration:40s]">
                    {testimonials.map((review) => (
                      <TestimonialCard key={review.username} {...review} />
                    ))}
                  </Marquee>
                  <Marquee pauseOnHover reverse repeat={3} className="[--duration:40s]">
                    {testimonials.map((review) => (
                      <TestimonialCard key={review.username} {...review} />
                    ))}
                  </Marquee>
                  {/* Edge fades removed per request */}
                </div>
              );
            })()}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}