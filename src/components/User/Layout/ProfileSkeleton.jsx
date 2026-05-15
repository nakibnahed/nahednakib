"use client";

import layoutStyles from "./UserLayout.module.css";
import sk from "./ProfileSkeleton.module.css";

function Bone({ className }) {
  return <div className={`${sk.bone} ${className || ""}`} />;
}

function SidebarSkeleton() {
  return (
    <div className={sk.sidebar}>
      <div className={sk.brandRow}>
        <Bone className={sk.brandIcon} />
        <div className={sk.brandLines}>
          <Bone className={sk.brandTitle} />
          <Bone className={sk.brandSub} />
        </div>
      </div>

      <div className={sk.navSection}>
        <Bone className={sk.navLabel} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={sk.navItem}>
            <Bone className={sk.navItemIcon} />
            <Bone className={sk.navItemText} style={{ width: `${55 + (i % 3) * 15}%` }} />
          </div>
        ))}
      </div>

      <div className={sk.userCard}>
        <Bone className={sk.userAvatar} />
        <div className={sk.userLines}>
          <Bone className={sk.userName} />
          <Bone className={sk.userRole} />
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className={sk.content}>
      <div className={sk.hero}>
        <div className={sk.heroEyebrow}>
          <Bone className={sk.chip} />
          <Bone className={sk.chip} />
        </div>
        <Bone className={sk.heroTitle} />
        <Bone className={sk.heroLead1} />
        <Bone className={sk.heroLead2} />
      </div>

      <div className={sk.grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={sk.card}>
            <Bone className={sk.cardIcon} />
            <div className={sk.cardLines}>
              <Bone className={sk.cardTitle} />
              <Bone className={sk.cardCount} />
              <Bone className={sk.cardDesc} />
            </div>
          </div>
        ))}
      </div>

      <div className={sk.activityCard}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={sk.activityItem}>
            <Bone className={sk.activityIcon} />
            <div className={sk.activityLines}>
              <Bone className={sk.activityText} />
              <Bone className={sk.activityDate} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileSkeleton() {
  return (
    <div className={layoutStyles.shell} aria-busy="true" aria-label="Loading your profile">
      <aside className={layoutStyles.sidebarWrap}>
        <SidebarSkeleton />
      </aside>
      <div className={layoutStyles.mainColumn}>
        <header className={layoutStyles.topBar}>
          <Bone style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0 }} />
          <Bone style={{ width: 80, height: 14, borderRadius: 4 }} />
        </header>
        <main className={layoutStyles.content}>
          <ContentSkeleton />
        </main>
      </div>
    </div>
  );
}
