import { useEffect, useState } from "react";

import { SiStrava } from "react-icons/si";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import InfoCard from "../InfoCard/InfoCard";
import styles from "./RunningContent.module.css";
import {
  Medal,
  Calendar,
  HeartPulse,
  Trophy,
  Flag,
  Clock,
  Activity as ActivityIcon,
  HeartPulse as HeartIcon,
  BarChart as BarChartIcon,
  ListChecks,
  Watch,
  Mountain,
} from "lucide-react";
import { FaThumbsUp, FaRegThumbsUp } from "react-icons/fa";
import { useSwipeable } from "react-swipeable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
} from "recharts";

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

        // Best day
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const runsPerDay = [0, 0, 0, 0, 0, 0, 0];
        weekActivities.forEach((a) => {
          const d = new Date(a.start_date_local);
          let dayIdx = d.getDay() - 1;
          if (dayIdx < 0) dayIdx = 6;
          runsPerDay[dayIdx]++;
        });
        const maxRuns = Math.max(...runsPerDay);
        const bestDay = maxRuns > 0 ? days[runsPerDay.indexOf(maxRuns)] : "-";
        // Longest run
        let longestRun = null;
        weekActivities.forEach((a) => {
          if (!longestRun || (a.distance || 0) > (longestRun.distance || 0))
            longestRun = a;
        });
        const longestRunDist =
          longestRun && longestRun.distance
            ? (longestRun.distance / 1000).toFixed(2)
            : "-";
        const longestRunDate =
          longestRun && longestRun.start_date_local
            ? new Date(longestRun.start_date_local).toLocaleDateString()
            : "-";
        // Avg run distance
        const avgRunDist =
          numRuns > 0 && totalDistance > 0
            ? (totalDistance / 1000 / numRuns).toFixed(2)
            : "-";
        // Total elevation gain
        const totalElevation = weekActivities.reduce(
          (sum, a) => sum + (a.total_elevation_gain || 0),
          0
        );
        // Avg run time
        const avgRunTime =
          numRuns > 0 ? formatTime(Math.round(totalTime / numRuns)) : "-";
        // Avg heart rate
        const heartRates = weekActivities
          .map((a) => a.average_heartrate)
          .filter(Boolean);
        const avgHeartRate =
          heartRates.length > 0
            ? Math.round(
                heartRates.reduce((a, b) => a + b, 0) / heartRates.length
              )
            : 0;
        // Total calories
        const totalCalories = weekActivities.reduce(
          (sum, a) => sum + (a.calories || 0),
          0
        );
        // Avg daily run (total distance / number of days with at least one run)
        const daysWithRun = new Set();
        weekActivities.forEach((a) => {
          if (a.type !== "Run") return;
          const d = new Date(a.start_date_local);
          let dayIdx = d.getDay() - 1;
          if (dayIdx < 0) dayIdx = 6;
          daysWithRun.add(dayIdx);
        });
        const avgDailyRun =
          daysWithRun.size > 0
            ? (totalDistance / 1000 / daysWithRun.size).toFixed(2)
            : "-";
        setWeeklyStats({
          totalDistance,
          totalTime,
          avgPace,
          numRuns,
          weekActivities,
          bestDay,
          longestRunDist,
          avgDailyRun,
          totalElevation: Math.round(totalElevation),
          avgRunTime,
          avgHeartRate,
          totalCalories: Math.round(totalCalories),
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

  function formatFriendlyDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    const time = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      const dateStr = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return `${dateStr} at ${time}`;
    }
  }

  // Swipe handlers for activity card
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrent((current + 1) % activities.length),
    onSwipedRight: () =>
      setCurrent((current - 1 + activities.length) % activities.length),
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 30,
  });

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
              <div className={styles.activityCard} {...swipeHandlers}>
                <div className={styles.activityName}>
                  {activities[current].name}
                </div>
                <div className={styles.activityDate}>
                  {formatFriendlyDate(activities[current].start_date)}
                </div>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>
                      <Flag size={18} />
                    </span>
                    <span className={styles.statLabel}>Distance:</span>
                    <span className={styles.statValue}>
                      {(activities[current].distance / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>
                      <Clock size={18} />
                    </span>
                    <span className={styles.statLabel}>Time:</span>
                    <span className={styles.statValue}>
                      {formatTime(activities[current].moving_time)}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statIcon}>
                      <ActivityIcon size={18} />
                    </span>
                    <span className={styles.statLabel}>Avg Pace:</span>
                    <span className={styles.statValue}>
                      {formatPace(activities[current].average_speed)}
                    </span>
                  </div>
                  {activities[current].average_heartrate && (
                    <div className={styles.statItem}>
                      <span className={styles.statIcon}>
                        <HeartIcon size={18} />
                      </span>
                      <span className={styles.statLabel}>Avg HR:</span>
                      <span className={styles.statValue}>
                        {Math.round(activities[current].average_heartrate)} bpm
                      </span>
                    </div>
                  )}
                </div>
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
        Icon={BarChartIcon}
        details={
          loadingWeekly ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading weekly stats…</div>
            </div>
          ) : weeklyStats ? (
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>
                  <Flag size={18} />
                </span>
                <span className={styles.statLabel}>Distance:</span>
                <span className={styles.statValue}>
                  {(weeklyStats.totalDistance / 1000).toFixed(2)} km
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>
                  <Clock size={18} />
                </span>
                <span className={styles.statLabel}>Time:</span>
                <span className={styles.statValue}>
                  {formatTime(weeklyStats.totalTime)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statIcon}>
                  <ActivityIcon size={18} />
                </span>
                <span className={styles.statLabel}>Avg Pace:</span>
                <span className={styles.statValue}>
                  {formatPaceFromSecondsPerKm(weeklyStats.avgPace)}
                </span>
              </div>
              {weeklyStats.avgHeartRate > 0 && (
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>
                    <HeartIcon size={18} />
                  </span>
                  <span className={styles.statLabel}>Avg HR:</span>
                  <span className={styles.statValue}>
                    {weeklyStats.avgHeartRate} bpm
                  </span>
                </div>
              )}
              {weeklyStats.totalElevation > 0 && (
                <div className={styles.statItem}>
                  <span className={styles.statIcon}>
                    <Mountain size={18} />
                  </span>
                  <span className={styles.statLabel}>Elevation Gain:</span>
                  <span className={styles.statValue}>
                    {weeklyStats.totalElevation} m
                  </span>
                </div>
              )}
              <div className={styles.statItem}>
                <span className={styles.statIcon}>
                  <ListChecks size={18} />
                </span>
                <span className={styles.statLabel}>Runs:</span>
                <span className={styles.statValue}>{weeklyStats.numRuns}</span>
              </div>
            </div>
          ) : null
        }
      />
      <InfoCard
        title="Weekly Analysis"
        size="large"
        Icon={BarChartIcon}
        details={
          loadingWeekly ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading weekly stats…</div>
            </div>
          ) : weeklyStats && weeklyStats.numRuns > 0 ? (
            <WeeklyAnalysisChart
              weekActivities={weeklyStats.weekActivities || []}
            />
          ) : null
        }
      />
      <InfoCard
        title="Personal Bests"
        size="medium"
        Icon={Trophy}
        details={
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>
                <Flag size={18} />
              </span>
              <span className={styles.statLabel}>5K:</span>
              <span className={styles.statValue}>!!! (!!!/km)</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>
                <Flag size={18} />
              </span>
              <span className={styles.statLabel}>10K:</span>
              <span className={styles.statValue}>!!! (!!!/km)</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>
                <Flag size={18} />
              </span>
              <span className={styles.statLabel}>Half-Marathon:</span>
              <span className={styles.statValue}>!!! (!!!/km)</span>
            </div>
          </div>
        }
      />
      <InfoCard
        title="Upcoming Goals"
        size="medium"
        Icon={Calendar}
        details={
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>
                <Trophy size={18} />
              </span>
              <span className={styles.statLabel}>5K Goal:</span>
              <span className={styles.statValue}>Break 16:30</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>
                <Trophy size={18} />
              </span>
              <span className={styles.statLabel}>10K Goal:</span>
              <span className={styles.statValue}>Sub-34:00</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>
                <Trophy size={18} />
              </span>
              <span className={styles.statLabel}>Marathon:</span>
              <span className={styles.statValue}>2h 30m</span>
            </div>
          </div>
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

// Helper to get runs per day (Mon-Sun) from weekActivities
function getRunsPerDay(weekActivities) {
  const runsPerDay = [0, 0, 0, 0, 0, 0, 0];
  weekActivities?.forEach((a) => {
    if (a.type !== "Run") return;
    const d = new Date(a.start_date_local);
    let dayIdx = d.getDay() - 1;
    if (dayIdx < 0) dayIdx = 6;
    runsPerDay[dayIdx]++;
  });
  return runsPerDay;
}

// Helper to get total distance per day (Mon-Sun) from weekActivities
function getDistancePerDay(weekActivities) {
  const distancePerDay = [0, 0, 0, 0, 0, 0, 0];
  weekActivities?.forEach((a) => {
    if (a.type !== "Run") return;
    const d = new Date(a.start_date_local);
    let dayIdx = d.getDay() - 1;
    if (dayIdx < 0) dayIdx = 6;
    distancePerDay[dayIdx] += (a.distance || 0) / 1000; // km
  });
  return distancePerDay;
}

// Helper to get chart data for Recharts
function getWeeklyChartData(weekActivities) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data = days.map((day, i) => ({
    day,
    distance: 0,
    avgPace: null,
    avgHR: null,
    runs: 0,
  }));
  weekActivities?.forEach((a) => {
    if (a.type !== "Run") return;
    const d = new Date(a.start_date_local);
    let dayIdx = d.getDay() - 1;
    if (dayIdx < 0) dayIdx = 6;
    data[dayIdx].distance += (a.distance || 0) / 1000; // km
    data[dayIdx].runs += 1;
    if (a.average_speed) {
      // Convert m/s to min/km
      const pace = 1000 / a.average_speed / 60;
      if (!data[dayIdx].paceSum) data[dayIdx].paceSum = 0;
      data[dayIdx].paceSum += pace;
    }
    if (a.average_heartrate) {
      if (!data[dayIdx].hrSum) data[dayIdx].hrSum = 0;
      if (!data[dayIdx].hrCount) data[dayIdx].hrCount = 0;
      data[dayIdx].hrSum += a.average_heartrate;
      data[dayIdx].hrCount += 1;
    }
  });
  // Calculate avgPace and avgHR
  data.forEach((d) => {
    d.avgPace =
      d.runs > 0 && d.paceSum
        ? parseFloat((d.paceSum / d.runs).toFixed(2))
        : null;
    d.avgHR = d.hrCount > 0 ? Math.round(d.hrSum / d.hrCount) : null;
    delete d.paceSum;
    delete d.hrSum;
    delete d.hrCount;
  });
  return data;
}

function WeeklyAnalysisChart({ weekActivities }) {
  const chartData = getWeeklyChartData(weekActivities);
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.13} />
          <XAxis dataKey="day" tick={{ fill: "var(--text-dark)" }} />
          <YAxis
            yAxisId="left"
            tick={{ fill: "var(--text-dark)" }}
            width={32}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Bar
            yAxisId="left"
            dataKey="distance"
            name="Distance"
            fill="var(--primary-color, #ee681a)"
            radius={[6, 6, 0, 0]}
            barSize={22}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="avgPace"
            name="Avg Pace"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
