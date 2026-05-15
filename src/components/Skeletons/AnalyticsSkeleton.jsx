"use client";

import Bone from "./Bone";
import s from "./AnalyticsSkeleton.module.css";

export default function AnalyticsSkeleton() {
  return (
    <div className={s.root} aria-busy="true">
      <div className={s.kpiGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.kpiCard}>
            <div className={s.kpiTop}>
              <Bone style={{ width: 32, height: 32, borderRadius: 9 }} />
              <Bone style={{ width: "60%", height: 12, borderRadius: 4 }} />
            </div>
            <Bone style={{ width: "45%", height: 28, borderRadius: 6, marginTop: 8 }} />
            <Bone style={{ width: "70%", height: 10, borderRadius: 4, marginTop: 6 }} />
          </div>
        ))}
      </div>

      <div className={s.chartRow}>
        <div className={s.chart}>
          <Bone style={{ width: "40%", height: 16, borderRadius: 5, marginBottom: 16 }} />
          <Bone style={{ width: "100%", height: 180, borderRadius: 10 }} />
        </div>
        <div className={s.chart}>
          <Bone style={{ width: "35%", height: 16, borderRadius: 5, marginBottom: 16 }} />
          <Bone style={{ width: "100%", height: 180, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}
