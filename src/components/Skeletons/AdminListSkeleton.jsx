"use client";

import Bone from "./Bone";
import s from "./AdminListSkeleton.module.css";

const ROW_WIDTHS = [
  ["38%", "14%", "16%", "10%"],
  ["52%", "12%", "18%", "10%"],
  ["44%", "15%", "14%", "10%"],
  ["35%", "13%", "20%", "10%"],
  ["48%", "14%", "17%", "10%"],
  ["41%", "16%", "15%", "10%"],
];

function TableSkeleton({ rows }) {
  return (
    <div className={s.table}>
      <div className={s.tableHead}>
        {["55%", "15%", "18%", "12%"].map((w, i) => (
          <Bone key={i} style={{ width: w, height: 11, borderRadius: 4 }} />
        ))}
      </div>
      {ROW_WIDTHS.slice(0, rows).map((cols, r) => (
        <div key={r} className={s.tableRow}>
          {cols.map((w, c) => (
            <Bone key={c} style={{ width: w, height: 14, borderRadius: 4 }} />
          ))}
          <Bone style={{ width: 40, height: 40, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

export default function AdminListSkeleton({ rows = 6, stats = 2, compact = false }) {
  if (compact) {
    return <TableSkeleton rows={rows} />;
  }

  return (
    <div className={s.root} aria-busy="true">
      <div className={s.hero}>
        <Bone style={{ width: 60, height: 10, borderRadius: 4 }} />
        <Bone style={{ width: "42%", height: 30, borderRadius: 8 }} />
        <Bone style={{ width: "65%", height: 14, borderRadius: 4 }} />
      </div>

      {stats > 0 && (
        <div className={s.statsRow}>
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className={s.statCard}>
              <Bone style={{ width: 28, height: 28, borderRadius: 8 }} />
              <div className={s.statLines}>
                <Bone style={{ width: 32, height: 18, borderRadius: 5 }} />
                <Bone style={{ width: "70%", height: 10, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={s.controlsRow}>
        <Bone style={{ width: 150, height: 38, borderRadius: 10 }} />
        <Bone style={{ flex: 1, maxWidth: 360, height: 38, borderRadius: 10 }} />
      </div>

      <TableSkeleton rows={rows} />
    </div>
  );
}
