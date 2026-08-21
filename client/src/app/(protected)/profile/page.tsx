"use client";
import { useProfile } from "../../../features/auth/hooks/use-profile";
import { PageState } from "../../../components/status/page-state";
import { ErrorPanel } from "../../../components/status/error-panel";
/** Displays only safe own-profile fields returned by the protected authority. */
export default function ProfilePage() {
  const profile = useProfile();
  if (profile.isLoading) return <PageState title="Loading your profile" busy />;
  if (profile.error)
    return (
      <main id="main" className="dashboard">
        <ErrorPanel
          message="We could not load your profile."
          retry={() => void profile.refetch()}
        />
      </main>
    );
  if (!profile.data) return <PageState title="No profile found" />;
  return (
    <main id="main" className="dashboard">
      <span className="eyebrow">Account</span>
      <h1>Your profile</h1>
      <dl className="profile-card">
        <div>
          <dt>Name</dt>
          <dd>{profile.data.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{profile.data.email}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{profile.data.role}</dd>
        </div>
        <div>
          <dt>Verified</dt>
          <dd>{profile.data.isEmailVerified ? "Yes" : "No"}</dd>
        </div>
      </dl>
    </main>
  );
}
