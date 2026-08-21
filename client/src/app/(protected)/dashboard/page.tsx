"use client";
import { useAuthState } from "../../../features/auth/auth-store";
/** Welcomes the authenticated user into the protected product foundation. */
export default function DashboardPage() {
  const auth = useAuthState();
  return (
    <main id="main" className="dashboard">
      <span className="eyebrow">Your archive</span>
      <h1>Good to see you, {auth.session?.user.name}.</h1>
      <p>
        The foundation is ready. Your files and folders arrive in the next
        chapter.
      </p>
      <section className="empty-card">
        <div className="empty-mark">G</div>
        <h2>A clean beginning</h2>
        <p>This space is intentionally empty for now.</p>
      </section>
    </main>
  );
}
