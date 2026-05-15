"use client";

import Bone from "./Bone";
import s from "./UserCardListSkeleton.module.css";

const CARD_SHAPES = [
  { title: "65%", line1: "90%", line2: "55%" },
  { title: "75%", line1: "80%", line2: "70%" },
  { title: "58%", line1: "95%", line2: "45%" },
  { title: "70%", line1: "85%", line2: "60%" },
];

export default function UserCardListSkeleton({ cards = 4 }) {
  return (
    <div className={s.root} aria-busy="true">
      <div className={s.header}>
        <Bone style={{ width: "38%", height: 28, borderRadius: 7 }} />
        <Bone style={{ width: "55%", height: 14, borderRadius: 4 }} />
      </div>

      <div className={s.list}>
        {CARD_SHAPES.slice(0, cards).map((shape, i) => (
          <div key={i} className={s.card}>
            <div className={s.cardTop}>
              <div className={s.cardMeta}>
                <Bone style={{ width: shape.title, height: 16, borderRadius: 5 }} />
                <Bone style={{ width: 80, height: 11, borderRadius: 4 }} />
              </div>
              <Bone style={{ width: 64, height: 30, borderRadius: 8 }} />
            </div>
            <div className={s.cardBody}>
              <Bone style={{ width: shape.line1, height: 13, borderRadius: 4 }} />
              <Bone style={{ width: shape.line2, height: 13, borderRadius: 4 }} />
            </div>
            <div className={s.cardFooter}>
              <Bone style={{ width: 72, height: 22, borderRadius: 999 }} />
              <Bone style={{ width: 60, height: 22, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
