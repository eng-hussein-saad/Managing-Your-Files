import { FileoraBrand } from "../components/brand/fileora-brand";
import { AppFooter } from "../components/layout/app-footer";
import { ThemeSelector } from "../components/theme/theme-selector";

/** Introduces Fileora and directs visitors into authentication journeys. */
export default function HomePage() {
  return (
    <div className="app-shell"><main id="main" className="landing">
      <nav>
        <FileoraBrand tagline />
        <span className="landing-actions"><ThemeSelector /><a className="nav-link" href="/login">Sign in</a></span>
      </nav>
      <section className="hero">
        <div>
          <span className="eyebrow">Your files. Organized your way.</span>
          <h1>
            Build an archive
            <br />
            that outlives the moment.
          </h1>
          <p>
            Fileora gives your most valuable files and ideas a calm, secure
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
    </main><AppFooter /></div>
  );
}
