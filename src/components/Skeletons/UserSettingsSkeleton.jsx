"use client";

import Bone from "./Bone";
import s from "./UserSettingsSkeleton.module.css";

function SectionSkeleton({ fields = 3 }) {
  return (
    <div className={s.section}>
      <div className={s.sectionHead}>
        <Bone style={{ width: 36, height: 36, borderRadius: 10 }} />
        <div className={s.sectionHeadLines}>
          <Bone style={{ width: 52, height: 10, borderRadius: 4 }} />
          <Bone style={{ width: "55%", height: 16, borderRadius: 5 }} />
          <Bone style={{ width: "80%", height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div className={s.fields}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className={s.field}>
            <Bone style={{ width: `${28 + i * 10}%`, height: 12, borderRadius: 4 }} />
            <Bone style={{ width: "100%", height: 40, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UserSettingsSkeleton() {
  return (
    <div className={s.root} aria-busy="true">
      <div className={s.hero}>
        <Bone style={{ width: 120, height: 14, borderRadius: 5 }} />
        <div className={s.heroMeta}>
          <Bone style={{ width: 56, height: 10, borderRadius: 4 }} />
          <Bone style={{ width: 72, height: 22, borderRadius: 999 }} />
        </div>
        <Bone style={{ width: "50%", height: 30, borderRadius: 8 }} />
        <Bone style={{ width: "70%", height: 14, borderRadius: 4 }} />
      </div>

      <div className={s.avatarSection}>
        <Bone style={{ width: 80, height: 80, borderRadius: "50%" }} />
        <div className={s.avatarLines}>
          <Bone style={{ width: 140, height: 36, borderRadius: 8 }} />
          <Bone style={{ width: "100%", height: 40, borderRadius: 8 }} />
        </div>
      </div>

      <SectionSkeleton fields={4} />
      <SectionSkeleton fields={2} />

      <Bone style={{ width: 140, height: 42, borderRadius: 10, alignSelf: "flex-start" }} />
    </div>
  );
}
