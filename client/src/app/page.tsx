/** Introduces the product and directs visitors into authentication journeys. */
export default function HomePage() {
  return (
    <main id="main" className="landing">
      <nav>
        <a className="brand" href="/">
          Gold Era<span>.</span>
        </a>
        <a className="nav-link" href="/login">
          Sign in
        </a>
      </nav>
      <section className="hero">
        <div>
          <span className="eyebrow">Your work. Kept with intention.</span>
          <h1>
            Build an archive
            <br />
            that outlives the moment.
          </h1>
          <p>
            Gold Era gives your most valuable files and ideas a calm, secure
            place to grow.
          </p>
          <div className="actions">
            <a className="button" href="/register">
              Create your archive
            </a>
            <a className="text-link" href="/login">
              I already have an account <span>→</span>
            </a>
          </div>
        </div>
        <aside aria-label="Product qualities">
          <div className="gold-orbit" />
          <dl>
            <div>
              <dt>Private by design</dt>
              <dd>Long-lived credentials stay beyond browser scripts.</dd>
            </div>
            <div>
              <dt>Quietly resilient</dt>
              <dd>Your session renews without disrupting your work.</dd>
            </div>
            <div>
              <dt>Built for what follows</dt>
              <dd>A strong identity foundation for everything you keep.</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
