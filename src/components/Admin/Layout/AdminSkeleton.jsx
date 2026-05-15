"use client";

import Bone from "@/components/Skeletons/Bone";
import layoutStyles from "./AdminLayout.module.css";
import s from "./AdminSkeleton.module.css";

const NAV_COUNT = 12;
const NAV_WIDTHS = [55, 42, 62, 48, 58, 50, 38, 55, 62, 56, 68, 48];

function AdminSidebarSkeleton() {
  return (
    <div className={s.sidebar}>
      <div className={s.brandRow}>
        <Bone style={{ width: 36, height: 36, borderRadius: 10 }} />
        <div className={s.brandLines}>
          <Bone style={{ width: 52, height: 13, borderRadius: 4 }} />
          <Bone style={{ width: 88, height: 11, borderRadius: 4 }} />
        </div>
      </div>

      <div className={s.navSection}>
        <Bone style={{ width: 72, height: 10, borderRadius: 4, marginBottom: 8 }} />
        {NAV_WIDTHS.map((w, i) => (
          <div key={i} className={s.navItem}>
            <Bone style={{ width: 20, height: 20, borderRadius: 6 }} />
            <Bone style={{ width: `${w}%`, height: 13, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      <div className={s.adminCard}>
        <Bone style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
        <div className={s.adminLines}>
          <Bone style={{ width: 90, height: 13, borderRadius: 4 }} />
          <Bone style={{ width: 60, height: 11, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );
}

function AdminContentSkeleton() {
  return (
    <div className={s.content}>
      <div className={s.hero}>
        <Bone style={{ width: 56, height: 11, borderRadius: 4 }} />
        <Bone style={{ width: "45%", height: 32, borderRadius: 8 }} />
        <Bone style={{ width: "70%", height: 15, borderRadius: 4 }} />
        <Bone style={{ width: "50%", height: 15, borderRadius: 4 }} />
      </div>

      <div className={s.statsRow}>
        {[80, 68].map((w, i) => (
          <div key={i} className={s.statCard}>
            <Bone style={{ width: 28, height: 28, borderRadius: 8 }} />
            <div className={s.statLines}>
              <Bone style={{ width: 36, height: 18, borderRadius: 5 }} />
              <Bone style={{ width: `${w}%`, height: 11, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <div className={s.controlsRow}>
        <Bone style={{ width: 140, height: 38, borderRadius: 10 }} />
        <Bone style={{ flex: 1, height: 38, borderRadius: 10 }} />
      </div>

      <div className={s.tableBody}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.tableRow}>
            <Bone style={{ width: "35%", height: 14, borderRadius: 4 }} />
            <Bone style={{ width: "15%", height: 14, borderRadius: 4 }} />
            <Bone style={{ width: "18%", height: 14, borderRadius: 4 }} />
            <Bone style={{ width: 40, height: 40, borderRadius: 8 }} />
            <Bone style={{ width: "12%", height: 14, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSkeleton() {
  return (
    <div className={layoutStyles.shell} aria-busy="true" aria-label="Loading admin panel">
      <aside className={layoutStyles.sidebarWrap}>
        <AdminSidebarSkeleton />
      </aside>
      <div className={layoutStyles.mainColumn}>
        <header className={layoutStyles.topBar}>
          <Bone style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0 }} />
          <Bone style={{ width: 72, height: 14, borderRadius: 4 }} />
        </header>
        <main className={layoutStyles.content}>
          <AdminContentSkeleton />
        </main>
      </div>
    </div>
  );
}
