"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { SmartImage } from "@/components/ui/SmartImage";
import { ButtonLink } from "@/components/ui/Button";
import { AvailabilityWidget } from "@/components/booking/AvailabilityWidget";
import type { SiteImage } from "@/types";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * The one orchestrated motion on the page: the photograph settles in and the text rises once on load.
 * Reduced-motion users get the final state immediately.
 */
export function Hero({ name, image }: { name: string; image: SiteImage }) {
  const reduce = useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, getReducedMotionServerSnapshot);
  const rise = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: "easeOut" as const } };

  return (
    <section aria-labelledby="hero-title">
      <div className="relative flex min-h-[88svh] items-end overflow-hidden bg-forest-dark">
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease: "easeOut" }}
        >
          <SmartImage image={image} sizes="100vw" priority wrapperClassName="h-full w-full" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-forest-dark/50 to-forest-dark/55" aria-hidden />

        <div className="container-page relative pb-28 pt-40 sm:pb-36">
          <motion.p {...rise(0.2)} className="mb-4 text-lg text-sand-light">
            Shimshal Valley, Upper Hunza
          </motion.p>
          <motion.h1 id="hero-title" {...rise(0.35)} className="max-w-3xl !text-stone text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl">
            Experience Comfort in the Heart of Shimshal.
          </motion.h1>
          <motion.p {...rise(0.5)} className="mt-6 max-w-xl text-lg text-stone/85">
            {name} is a mountain hotel with warm rooms, a restaurant serving fresh meals, and the high peaks of Hunza outside your window.
          </motion.p>
          <motion.div {...rise(0.65)} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/rooms" variant="light">Explore Rooms</ButtonLink>
            <ButtonLink href="/booking" variant="ghost">Book Your Stay</ButtonLink>
          </motion.div>
        </div>
      </div>

      <div className="container-page relative z-10 -mt-14 sm:-mt-16">
        <AvailabilityWidget />
      </div>
    </section>
  );
}
