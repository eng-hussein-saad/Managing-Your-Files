"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileoraBrand } from "../components/brand/fileora-brand";
import { GuestRoute } from "../components/auth/guest-route";
import { ThemeSelector } from "../components/theme/theme-selector";

/** Introduces Fileora and directs visitors into authentication journeys. */
export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const enter = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 20 };
  return (
    <GuestRoute>
      <div className="app-shell landing-shell">
      <motion.header
        className="landing-nav"
        initial={reduceMotion ? false : { opacity: 1, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
      >
        <div className="landing-nav-inner">
          <FileoraBrand />
          <span className="landing-actions">
            <ThemeSelector />
            <a className="nav-link" href="/login">
              Sign in
            </a>
          </span>
        </div>
      </motion.header>
      <main id="main" className="landing">
        <section className="landing-hero">
          <motion.div
            className="landing-copy"
            initial={enter}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
          >
            <span className="eyebrow">Your files. Organized your way.</span>
            <h1>Order for every file.</h1>
            <p>
              Fileora gives your personal archive a calm, dependable home—with
              resilient sessions, precise organization, and room to grow.
            </p>
            <div className="landing-cta">
              <a className="ui-button primary" href="/register">
                Create your account
              </a>
              <a className="ui-button ghost" href="/login">
                I already have an account
              </a>
            </div>
          </motion.div>
          <motion.div
            className="landing-visual"
            role="img"
            aria-label="Fileora workspace preview"
            initial={
              reduceMotion ? false : { opacity: 1, y: 28 }
            }
            animate={{ opacity: 1, y: 0 }}
            whileHover={reduceMotion ? undefined : { y: -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeOut" }}
          >
            <div className="preview-sidebar">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-workspace">
              <span className="preview-search" />
              <div className="preview-files">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </motion.div>
        </section>
        <motion.section
          className="landing-features"
          aria-label="Fileora benefits"
          initial={reduceMotion ? false : { opacity: 1, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.5,
            delay: reduceMotion ? 0 : 0.25,
            ease: "easeOut",
          }}
        >
          <article>
            <span>01</span>
            <h2>Owner-scoped privacy</h2>
            <p>Every file remains tied to the account that owns it.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Session resilience</h2>
            <p>Protected renewal keeps interruptions away from your work.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Built to extend</h2>
            <p>A dependable foundation leaves room for your archive to grow.</p>
          </article>
        </motion.section>
      </main>
      </div>
    </GuestRoute>
  );
}
