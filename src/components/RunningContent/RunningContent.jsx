// src/components/RunningContent/RunningContent.jsx
import InfoCard from "../InfoCard/InfoCard";
import styles from "./RunningContent.module.css";
import {
  Medal,
  MapPin,
  Calendar,
  HeartPulse,
  Trophy,
  Flag,
} from "lucide-react";

export default function RunningContent() {
  return (
    <div className={styles.container}>
      <InfoCard
        title="Running Background"
        size="large"
        Icon={Medal}
        details={
          <>
            <p>
              I’m a competitive long-distance runner based in Germany. I focus
              on high-performance training for road races, mainly 5K, 10K, and
              half-marathon distances. My approach blends discipline, science,
              and passion for running.
            </p>
          </>
        }
      />

      <InfoCard
        title="Training & Setup"
        size="medium"
        Icon={HeartPulse}
        details={
          <>
            <p>Weekly mileage: ~110 km</p>
            <p> Current pace: 3:30/km</p>
            <p> Target pace: 3:20/km</p>
            <p>
              Tools: Garmin HRM-Pro chest strap, structured workouts, recovery
              tracking
            </p>
          </>
        }
      />

      <InfoCard
        title="Personal Bests"
        size="medium"
        Icon={Trophy}
        details={
          <>
            <p> 🏃‍♂️ 5K: 16:45 (3:21/km)</p>

            <p> 🏃‍♂️ 10K: 35:10 (3:31/km)</p>

            <p> 🏃‍♂️ Half-Marathon: 1:20:00 (3:47/km)</p>
          </>
        }
      />

      <InfoCard
        title="Upcoming Goals"
        size="medium"
        Icon={Calendar}
        details={
          <>
            <p> ✅ Break 16:30 in 5K (Fall 2025)</p>

            <p> ✅ Sub-33 10K (Late 2025)</p>
            <p>✅ Marathon goal: 2h 30m (2026)</p>
          </>
        }
      />

      <InfoCard
        title="Achievements"
        size="medium"
        Icon={Flag}
        details={
          <>
            <p>
              🥈 2nd place – Berlin 10K (2024)
              <br />
              🥉 3rd place – Hamburg 5K (2024)
              <br />
              🏅 Qualified – National 5K Finals
            </p>
          </>
        }
      />
    </div>
  );
}
