"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageComparison, BeforeAfterCard } from "@/components/ui/image-comparison";
import {
  ArrowRight,
  Check,
  Star,
  ChevronDown,
  Clock,
  Zap,
  Shield,
  Users,
  Sparkles,
  Camera,
  Download,
  Wand2,
} from "lucide-react";
import Link from "next/link";


// Sample images (high-quality Unsplash photos for demo)
const SAMPLE_IMAGES = {
  before1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
  after1: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face",
  before2: "https://images.unsplash.com/photo-1494790108755-2616b612b2a6?w=400&h=500&fit=crop&crop=face",
  after2: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop&crop=face",
  before3: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
  after3: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face",
};

// Testimonials data
const testimonials = [
  {
    quote: "I was skeptical at first, but the results blew me away. Got my dream job with these headshots on LinkedIn!",
    author: "Sarah Mitchell",
    role: "Product Manager at Google",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b2a6?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    quote: "Saved me $400 and a whole day. The AI perfectly captured my professional look. Highly recommend!",
    author: "James Chen",
    role: "Startup Founder",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    quote: "As a real estate agent, I need fresh photos constantly. PicPro AI is now my go-to solution.",
    author: "Maria Lopez",
    role: "Top 1% Realtor",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
];

// Pricing data
const pricingPlans = [
  {
    name: "Starter",
    price: 29,
    description: "Perfect for LinkedIn",
    features: [
      "40 AI headshots",
      "5 professional styles",
      "48-hour delivery",
      "High-resolution downloads",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: 49,
    description: "Best for job seekers",
    features: [
      "100 AI headshots",
      "10 professional styles",
      "2-hour express delivery",
      "4K resolution downloads",
      "LinkedIn banner included",
    ],
    cta: "Most Popular",
    popular: true,
  },
  {
    name: "Executive",
    price: 99,
    description: "Complete branding package",
    features: [
      "200+ AI headshots",
      "All styles unlocked",
      "1-hour priority delivery",
      "4K + RAW formats",
      "Custom backgrounds",
      "Priority support",
    ],
    cta: "Go Premium",
    popular: false,
  },
];

// FAQ data
const faqs = [
  {
    question: "How does it work?",
    answer: "Simply upload 10-15 photos of yourself (selfies work great!). Our AI analyzes your unique features and generates professional headshots in various styles. The whole process takes about 30 minutes.",
  },
  {
    question: "What kind of photos should I upload?",
    answer: "Upload clear photos of your face from different angles. Good lighting helps! Selfies, casual photos, and even older photos work well. The more variety, the better the results.",
  },
  {
    question: "How long does it take?",
    answer: "Depending on your package: Starter (48 hours), Professional (2 hours), Executive (1 hour). Most users get their headshots much faster!",
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "Absolutely! We offer a 100% money-back guarantee. If you're not happy with your headshots, contact us within 7 days for a full refund.",
  },
  {
    question: "Are the headshots really AI-generated?",
    answer: "Yes! We use state-of-the-art AI trained on millions of professional photos. The AI learns your unique features and generates completely new, professional-looking headshots.",
  },
  {
    question: "Can I use these for LinkedIn?",
    answer: "Absolutely! Your headshots are yours to use anywhere - LinkedIn, resumes, company websites, social media, and more.",
  },
];

// FAQ Accordion Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        className="w-full py-5 flex items-center justify-between text-left group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

// Pricing Card
function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  popular,
}: typeof pricingPlans[0]) {
  return (
    <Card
      className={`relative p-6 md:p-8 h-full flex flex-col ${
        popular
          ? "border-primary/50 bg-gradient-to-b from-primary/5 to-transparent"
          : "border-border/50"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-muted-foreground text-sm">one-time</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Link href="/upload" className="mt-auto">
        <Button
          variant={popular ? "default" : "outline"}
          size="lg"
          className="w-full"
        >
          {cta}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
    </Card>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">PicPro AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>
            <Link href="/upload">
              <Button size="default">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 bg-spotlight">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Trusted by 10,000+ professionals</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6 text-balance">
                Professional Headshots
                <br />
                <span className="gradient-text">in Minutes, Not Hours</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 text-pretty">
                Upload a few selfies, and our AI creates 100+ stunning professional
                headshots. Perfect for LinkedIn, resumes, and your personal brand.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/upload">
                  <Button size="xl" variant="glow">
                    Get Your Headshots Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  100% money-back guarantee
                </p>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10 pt-8 border-t border-border/30">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-accent" />
                  <span className="text-sm">30 min delivery</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-accent" />
                  <span className="text-sm">50,000+ headshots</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Image - Before/After Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <ImageComparison
                beforeImage={SAMPLE_IMAGES.before1}
                afterImage={SAMPLE_IMAGES.after1}
                beforeLabel="Your Selfie"
                afterLabel="AI Headshot"
              />
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 md:bottom-8 md:-right-8 bg-card border border-border/50 rounded-xl p-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">AI Powered</p>
                    <p className="text-xs text-muted-foreground">Studio quality results</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logo Bar */}
      <section className="py-10 border-y border-border/30 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Perfect for professionals on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
            <span className="text-xl font-bold tracking-tight">LinkedIn</span>
            <span className="text-xl font-bold tracking-tight">Indeed</span>
            <span className="text-xl font-bold tracking-tight">Glassdoor</span>
            <span className="text-xl font-bold tracking-tight">AngelList</span>
            <span className="text-xl font-bold tracking-tight">Hired</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-accent mb-3 block">Simple Process</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to get your professional headshots. No studio visit required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Camera,
                step: "01",
                title: "Upload Selfies",
                description: "Upload 10-15 photos of yourself. Different angles and lighting work best.",
              },
              {
                icon: Wand2,
                step: "02",
                title: "AI Magic",
                description: "Our AI learns your unique features and generates professional headshots.",
              },
              {
                icon: Download,
                step: "03",
                title: "Download & Use",
                description: "Get 100+ high-resolution headshots ready for LinkedIn and more.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full border-border/50 card-hover">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-4xl font-bold text-muted/30">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="py-20 md:py-28 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-accent mb-3 block">Transformations</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See the Difference
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hover over each image to see the transformation from selfie to professional headshot.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <BeforeAfterCard
              beforeImage={SAMPLE_IMAGES.before1}
              afterImage={SAMPLE_IMAGES.after1}
              title="Tech Executive"
            />
            <BeforeAfterCard
              beforeImage={SAMPLE_IMAGES.before2}
              afterImage={SAMPLE_IMAGES.after2}
              title="Creative Director"
            />
            <BeforeAfterCard
              beforeImage={SAMPLE_IMAGES.before3}
              afterImage={SAMPLE_IMAGES.after3}
              title="Finance Professional"
            />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-accent mb-3 block">Save Time & Money</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why PicPro AI?
            </h2>
          </motion.div>

          <Card className="p-6 md:p-8 border-border/50">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4 text-muted-foreground line-through">
                  Traditional Photographer
                </h3>
                <ul className="space-y-3">
                  {[
                    "$200-500+ per session",
                    "Schedule weeks in advance",
                    "Travel to studio",
                    "Limited outfit changes",
                    "5-10 photos only",
                    "Days for delivery",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs">
                        ✕
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 gradient-text">
                  PicPro AI
                </h3>
                <ul className="space-y-3">
                  {[
                    "Just $29-99 one-time",
                    "Start instantly",
                    "From your couch",
                    "Unlimited style variations",
                    "100+ professional headshots",
                    "Ready in 30 minutes",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-accent mb-3 block">Simple Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Package
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              One-time payment. No subscriptions. Keep your headshots forever.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <PricingCard {...plan} />
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-center mt-10 text-sm text-muted-foreground flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Shield className="w-4 h-4" />
            100% money-back guarantee if you&apos;re not satisfied
          </motion.p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-accent mb-3 block">Success Stories</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Professionals
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full border-border/50 flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 flex-grow leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-28 px-4 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-medium text-accent mb-3 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Common Questions
            </h2>
          </motion.div>

          <Card className="p-6 md:p-8 border-border/50">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
              Ready to Transform Your
              <br />
              <span className="gradient-text">Professional Image?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 10,000+ professionals who&apos;ve upgraded their online presence
              with PicPro AI headshots.
            </p>
            <Link href="/upload">
              <Button size="xl" variant="glow">
                Get Your Headshots Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Starting at $29 · 100% money-back guarantee
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">PicPro AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PicPro AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
