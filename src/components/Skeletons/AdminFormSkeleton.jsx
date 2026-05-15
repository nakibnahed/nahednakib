"use client";

import Bone from "./Bone";
import s from "./AdminFormSkeleton.module.css";

function FieldRow({ labelWidth = "30%", inputHeight = 40 }) {
  return (
    <div className={s.field}>
      <Bone style={{ width: labelWidth, height: 12, borderRadius: 4 }} />
      <Bone style={{ width: "100%", height: inputHeight, borderRadius: 8 }} />
    </div>
  );
}

function SectionBlock({ fields = 3 }) {
  return (
    <div className={s.section}>
      <div className={s.sectionHead}>
        <Bone style={{ width: 36, height: 36, borderRadius: 10 }} />
        <div className={s.sectionHeadLines}>
          <Bone style={{ width: 60, height: 10, borderRadius: 4 }} />
          <Bone style={{ width: "50%", height: 16, borderRadius: 5 }} />
          <Bone style={{ width: "75%", height: 12, borderRadius: 4 }} />
        </div>
      </div>
      <div className={s.fields}>
        {Array.from({ length: fields }).map((_, i) => (
          <FieldRow key={i} labelWidth={`${28 + i * 8}%`} />
        ))}
      </div>
    </div>
  );
}

export default function AdminFormSkeleton() {
  return (
    <div className={s.root} aria-busy="true">
      <div className={s.hero}>
        <Bone style={{ width: 110, height: 14, borderRadius: 5 }} />
        <div className={s.heroMeta}>
          <Bone style={{ width: 56, height: 10, borderRadius: 4 }} />
          <Bone style={{ width: 72, height: 22, borderRadius: 999 }} />
        </div>
        <Bone style={{ width: "55%", height: 32, borderRadius: 8 }} />
        <Bone style={{ width: "70%", height: 14, borderRadius: 4 }} />
      </div>

      <div className={s.layout}>
        <div className={s.main}>
          <SectionBlock fields={3} />
          <div className={s.editorArea}>
            <Bone style={{ width: "40%", height: 12, borderRadius: 4, marginBottom: 8 }} />
            <Bone style={{ width: "100%", height: 340, borderRadius: 10 }} />
          </div>
          <SectionBlock fields={2} />
        </div>

        <div className={s.sidebar}>
          <SectionBlock fields={2} />
          <SectionBlock fields={3} />
        </div>
      </div>
    </div>
  );
}
