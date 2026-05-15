"use client";

import Bone from "./Bone";
import s from "./EngagementSkeleton.module.css";

export default function EngagementSkeleton() {
  return (
    <div className={s.root} aria-busy="true">
      <div className={s.actions}>
        {[52, 60, 44].map((w, i) => (
          <Bone key={i} style={{ width: w, height: 36, borderRadius: 10 }} />
        ))}
      </div>

      <div className={s.commentsSection}>
        <Bone style={{ width: "30%", height: 18, borderRadius: 5, marginBottom: 16 }} />
        {[85, 70, 90].map((w, i) => (
          <div key={i} className={s.commentItem}>
            <Bone style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
            <div className={s.commentLines}>
              <Bone style={{ width: "25%", height: 12, borderRadius: 4 }} />
              <Bone style={{ width: `${w}%`, height: 13, borderRadius: 4 }} />
              <Bone style={{ width: "40%", height: 13, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
