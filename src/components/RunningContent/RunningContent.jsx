import { useEffect, useState } from "react";
import { SiStrava } from "react-icons/si";
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
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    fetch("/api/strava?per_page=20")
      .then((res) => res.json())
      .then((data) => {
        const activities = Array.isArray(data) ? data : [data];
        // Find the first non-private activity
        const publicActivity = activities.find((a) => !a.private);
        setActivity(publicActivity || null);
      })
      .catch(() => setActivity(null));
  }, []);

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatPace(avgSpeed) {
    if (!avgSpeed) return "N/A";
    // avgSpeed is in m/s, so pace (min/km) = 16.6667 / avgSpeed
    const pace = 1000 / avgSpeed / 60; // minutes per km
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")} /km`;
  }

  return (
    <div className={styles.container}>
      <InfoCard
        title="Last Activity"
        size="medium"
        Icon={SiStrava}
        details={
          activity ? (
            <>
              <p>
                <strong>{activity.name}</strong>
              </p>

              <p>Distance: {(activity.distance / 1000).toFixed(2)} km</p>

              <p>Time: {formatTime(activity.moving_time)}</p>

              <p>Avg Pace: {formatPace(activity.average_speed)}</p>

              <p>
                Date:{" "}
                {new Date(activity.start_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                {new Date(activity.start_date).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p>
              {activity === null
                ? "Loading latest activity..."
                : "No public activity found."}
            </p>
          )
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
    </div>
  );
}
