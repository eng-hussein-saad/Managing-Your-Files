"use client";
import { useProfile } from "../../../features/auth/hooks/use-profile";
import { PageState } from "../../../components/status/page-state";
import { ErrorPanel } from "../../../components/status/error-panel";
import { Avatar, Card, Pill } from "../../../components/ui/surfaces";

/** Preserves the profile layout while its account fields are loading. */
function ProfileSkeleton() {
  return (
    <main
      id="main"
      className="profile-page app-page profile-skeleton"
      aria-busy="true"
    >
      <header className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Your profile</h1>
          <p>Safe identity details for this Fileora account.</p>
        </div>
      </header>
      <Card
        className="profile-identity profile-skeleton-identity"
        role="status"
        aria-label="Loading your profile"
      >
        <span className="sr-only">Loading your profile</span>
        <i className="profile-skeleton-avatar" aria-hidden="true" />
        <span className="profile-skeleton-copy" aria-hidden="true">
          <i />
          <i />
        </span>
        <i className="profile-skeleton-pill" aria-hidden="true" />
      </Card>
      <div
        className="profile-card ui-card profile-skeleton-details"
        aria-hidden="true"
      >
        {Array.from({ length: 4 }, (_value, index) => (
          <div key={index}>
            <i />
            <i />
          </div>
        ))}
      </div>
    </main>
  );
}

/** Displays only safe own-profile fields returned by the protected authority. */
export default function ProfilePage() {
  const profile = useProfile();
  if (profile.isLoading) return <ProfileSkeleton />;
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
    <main id="main" className="profile-page app-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Your profile</h1>
          <p>Safe identity details for this Fileora account.</p>
        </div>
      </header>
      <Card className="profile-identity">
        <Avatar name={profile.data.name} />
        <div>
          <h2>{profile.data.name}</h2>
          <p>{profile.data.email}</p>
        </div>
        <Pill tone={profile.data.isEmailVerified ? "success" : "warning"}>
          {profile.data.isEmailVerified ? "Verified" : "Not verified"}
        </Pill>
      </Card>
      <dl className="profile-card ui-card">
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
