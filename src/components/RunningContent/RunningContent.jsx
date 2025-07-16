import { useEffect, useState } from "react";

import { SiStrava } from "react-icons/si";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import InfoCard from "../InfoCard/InfoCard";
import styles from "./RunningContent.module.css";
import { Medal, Calendar, HeartPulse, Trophy, Flag } from "lucide-react";
import { FaThumbsUp, FaRegThumbsUp } from "react-icons/fa";

export default function RunningContent() {
  const [activities, setActivities] = useState([]);
  const [current, setCurrent] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [likeCounts, setLikeCounts] = useState({});
  const [likedActivities, setLikedActivities] = useState({});

  useEffect(() => {
    fetch("/api/strava?per_page=50")
      .then((res) => res.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [data];
        // Remove the filter for !a.private so private activities are included
        // const publicActivities = arr.filter((a) => !a.private);
        setActivities(arr.filter((a) => !a.private).slice(0, 3)); // keep public for Last Activities card

        // --- Weekly Stats Calculation ---
        // Get start of week (Monday)
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        // Filter activities for this week (runs only, using local time, include private)
        const weekActivities = arr.filter((a) => {
          if (a.type !== "Run") return false;
          const actDate = new Date(a.start_date_local);
          return actDate >= weekStart;
        });

        // Calculate stats
        const totalDistance = weekActivities.reduce(
          (sum, a) => sum + (a.distance || 0),
          0
        ); // meters
        const totalTime = weekActivities.reduce(
          (sum, a) => sum + (a.moving_time || 0),
          0
        ); // seconds
        const numRuns = weekActivities.length;
        const avgPace =
          totalDistance > 0 ? totalTime / (totalDistance / 1000) : 0; // sec/km

        setWeeklyStats({
          totalDistance,
          totalTime,
          avgPace,
          numRuns,
        });
        setLoadingWeekly(false);
      });
  }, []);

  // Fetch like count for current activity
  useEffect(() => {
    if (activities.length === 0) return;
    const activity = activities[current];
    if (!activity) return;
    const activityId = activity.id;
    // Get like state from localStorage
    const liked = localStorage.getItem(`activity_like_${activityId}`) === "1";
    setLikedActivities((prev) => ({ ...prev, [activityId]: liked }));
    // Fetch like count
    fetch(`/api/engagement/likes?activity_id=${activityId}`)
      .then((res) => res.json())
      .then((data) => {
        setLikeCounts((prev) => ({ ...prev, [activityId]: data.count || 0 }));
      });
  }, [activities, current]);

  // Like button handler
  const handleLike = async (activityId) => {
    if (likedActivities[activityId]) return;
    await fetch("/api/engagement/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity_id: activityId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLikeCounts((prev) => ({ ...prev, [activityId]: data.count || 0 }));
        setLikedActivities((prev) => ({ ...prev, [activityId]: true }));
        localStorage.setItem(`activity_like_${activityId}`, "1");
      });
  };

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

  // For Last Activities card (m/s to min/km)
  function formatPace(avgSpeed) {
    if (!avgSpeed) return "N/A";
    const pace = 1000 / avgSpeed / 60; // min/km
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}:${sec.toString().padStart(2, "0")}` + " /km";
  }

  // For weekly stats (seconds per km to min/km)
  function formatPaceFromSecondsPerKm(secondsPerKm) {
    if (!secondsPerKm || !isFinite(secondsPerKm)) return "N/A";
    const min = Math.floor(secondsPerKm / 60);
    const sec = Math.round(secondsPerKm % 60);
    return `${min}:${sec.toString().padStart(2, "0")}` + " /km";
  }

  return (
    <div className={styles.container}>
      <InfoCard
        title="Last Activities"
        size="medium"
        Icon={SiStrava}
        details={
          activities.length ? (
            <div>
              {/* Activity Content */}
              <div>
                <p>
                  <strong>{activities[current].name}</strong>
                </p>
                <p>
                  Distance: {(activities[current].distance / 1000).toFixed(2)}{" "}
                  km
                </p>
                <p>Time: {formatTime(activities[current].moving_time)}</p>
                <p>Avg Pace: {formatPace(activities[current].average_speed)}</p>
                {activities[current].average_heartrate && (
                  <p>
                    Avg Heart Rate:{" "}
                    {Math.round(activities[current].average_heartrate)} bpm
                  </p>
                )}
                <p>
                  Date:{" "}
                  {new Date(activities[current].start_date).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}{" "}
                  {new Date(
                    activities[current].start_date
                  ).toLocaleDateString()}
                </p>
                {/* Like button row */}
                <div className={styles.likeButtonRow}>
                  <button
                    className={`${styles.likeBtn} ${
                      likedActivities[activities[current].id]
                        ? styles.active
                        : ""
                    }`}
                    onClick={() => handleLike(activities[current].id)}
                    disabled={likedActivities[activities[current].id]}
                    aria-label="Like activity"
                    type="button"
                  >
                    {likedActivities[activities[current].id] ? (
                      <FaThumbsUp size={16} />
                    ) : (
                      <FaRegThumbsUp size={16} />
                    )}
                    <span>{likeCounts[activities[current].id] || 0}</span>
                  </button>
                </div>
              </div>
              {/* Carousel Arrows */}
              <div className={styles.carouselArrows}>
                <button
                  onClick={() =>
                    setCurrent(
                      (current - 1 + activities.length) % activities.length
                    )
                  }
                  disabled={activities.length < 2}
                  className={styles.carouselButton}
                  aria-label="Previous activity"
                >
                  <FiChevronLeft size={24} />
                </button>
                <span className={styles.carouselCounter}>
                  {current + 1} / {activities.length}
                </span>
                <button
                  onClick={() => setCurrent((current + 1) % activities.length)}
                  disabled={activities.length < 2}
                  className={styles.carouselButton}
                  aria-label="Next activity"
                >
                  <FiChevronRight size={24} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading activities…</div>
            </div>
          )
        }
      />
      <InfoCard
        title="This Week"
        size="medium"
        Icon={HeartPulse}
        details={
          loadingWeekly ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading weekly stats…</div>
            </div>
          ) : weeklyStats && weeklyStats.numRuns > 0 ? (
            <>
              <p>
                Total Distance: {(weeklyStats.totalDistance / 1000).toFixed(2)}{" "}
                km
              </p>
              <p>Total time: {formatTime(weeklyStats.totalTime)}</p>
              <p>
                Average pace: {formatPaceFromSecondsPerKm(weeklyStats.avgPace)}
              </p>
              <p>Number of runs: {weeklyStats.numRuns}</p>

              <p>Tools: Garmin Forerunner® 245 Music, Garmin HRM-Pro.</p>
            </>
          ) : (
            <>
              <p>No runs recorded this week yet.</p>
              <p>
                Tools: Garmin HRM-Pro chest strap, structured workouts, recovery
                tracking
              </p>
            </>
          )
        }
      />

      <InfoCard
        title="Personal Bests"
        size="medium"
        Icon={Trophy}
        details={
          <>
            <p> 5K: !!! (!!!/km)</p>
            <p> 10K: !!! (!!!/km)</p>
            <p> Half-Marathon: !!! (!!!/km)</p>
          </>
        }
      />
      <InfoCard
        title="Upcoming Goals"
        size="medium"
        Icon={Calendar}
        details={
          <>
            <p> Break 16:30 in 5K (Fall 2025)</p>
            <p> Sub-34:00 10K (Late 2025)</p>
            <p> Marathon goal: 2h 30m (2026)</p>
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
    </div>
  );
}
