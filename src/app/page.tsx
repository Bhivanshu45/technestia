"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  MessageSquareText,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";

import Navbar from "@/components/navbar/Navbar";
import { Button } from "@/components/ui/button";

const heroStats = [
  { label: "Realtime sync", value: "Chat, presence, notifications" },
  { label: "Discovery", value: "Projects, people, milestones" },
  { label: "Execution", value: "From idea to release" },
];

const collageCards = [
  {
    src: "/landing/hero-dashboard.png",
    alt: "Technestia hero dashboard overview",
    title: "Hero dashboard overview",
    description: "A wide product view that shows the platform at a glance.",
    className: "md:col-span-2",
  },
  {
    src: "/landing/collaboration-room.png",
    alt: "Technestia collaboration room with realtime chat",
    title: "Realtime collaboration room",
    description: "Chat, presence, and updates in one live workspace.",
  },
  {
    src: "/landing/project-discovery.png",
    alt: "Technestia project discovery search page",
    title: "Project discovery search",
    description: "Explore public work and find the right team faster.",
  },
  {
    src: "/landing/milestone-roadmap.png",
    alt: "Technestia milestone roadmap and progress tracker",
    title: "Milestone roadmap",
    description: "Show progress, deadlines, and updates in a clean layout.",
  },
  {
    src: "/landing/activity-notifications.jpeg",
    alt: "Technestia activity feed and notifications board",
    title: "Activity and notifications",
    description: "Keep the product feeling active and current.",
  },
];

const pillars = [
  {
    icon: LayoutDashboard,
    title: "Clear project visibility",
    description:
      "Track public work, active milestones, and progress without digging through scattered pages.",
  },
  {
    icon: MessageSquareText,
    title: "Realtime collaboration",
    description:
      "Keep chat, read states, and notifications aligned so the team sees the same story everywhere.",
  },
  {
    icon: Compass,
    title: "Fast project discovery",
    description:
      "Search public projects and open opportunities quickly through the existing explore flow.",
  },
  {
    icon: TrendingUp,
    title: "Momentum you can show",
    description:
      "Surface achievements, activity, and updates in a way that feels active instead of static.",
  },
];

const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "Public projects", href: "/explore" },
      { label: "Find collaborators", href: "/collaborations/join" },
      { label: "Achievements", href: "/achievements" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Dashboard", href: "/projects" },
      { label: "Chat", href: "/chat" },
      { label: "Notifications", href: "/activity/notifications" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/sign-in" },
      { label: "Create account", href: "/auth/sign-up" },
      { label: "Profile", href: "/profile" },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07070b] text-slate-100">
      <Navbar />
      <main className="relative overflow-hidden pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-8rem] top-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute right-[-6rem] top-24 h-[24rem] w-[24rem] rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        </div>

        <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Built to show the real work, not just a shell
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                A sharper home for projects, people, and momentum.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Technestia brings discovery, collaboration, milestones, chat,
                and notifications into one product story so the platform feels
                active from the very first scroll.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                <Link href="/explore" className="inline-flex items-center gap-2">
                  Explore projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/auth/sign-up">Join the workspace</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.08, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-400/15 via-transparent to-emerald-400/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">
                    Live workspace
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Search, collaborate, and ship in one place
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  realtime
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {collageCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.1 * index }}
                    className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 ${card.className || ""}`}
                  >
                    <div className="relative h-52 w-full md:h-60">
                      <Image
                        src={card.src}
                        alt={card.alt}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-sm font-semibold text-white">
                          {card.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6 }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-emerald-100">
                <Workflow className="h-3.5 w-3.5" />
                What the product does
              </div>
              <h2 className="mt-5 text-3xl font-semibold text-white md:text-4xl">
                A platform that feels alive, organized, and credible.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
                The landing page should prove that Technestia is not a demo
                shell. It should immediately show working discovery, progress,
                messaging, and activity so the product looks invested and real.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  "Search existing project surfaces without adding extra clutter.",
                  "Keep the homepage visually strong with motion and balanced color.",
                  "Use the same language across public and authenticated views.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="rounded-[1.75rem] border border-white/10 bg-[#0d0d12] p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {pillar.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#060609]">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100">
                  <BellRing className="h-3.5 w-3.5" />
                  Search, build, collaborate
                </div>
                <h2 className="max-w-xl text-3xl font-semibold text-white md:text-4xl">
                  Designed to feel serious from the first visit.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-slate-300 md:text-base">
                  Use the five visuals in public/landing, keep the page motion subtle, and let the footer close the story with clear navigation.
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-3">
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100">
                      {column.title}
                    </h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      {column.links.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className="block transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Technestia. Built for people who actually ship together.</p>
              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                <Link href="/explore" className="transition-colors hover:text-white">
                  Explore
                </Link>
                <Link href="/auth/sign-in" className="transition-colors hover:text-white">
                  Sign in
                </Link>
                <Link href="/auth/sign-up" className="transition-colors hover:text-white">
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
