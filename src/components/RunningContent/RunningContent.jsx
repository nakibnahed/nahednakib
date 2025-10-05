import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";

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
  // Optimized state with caching
  const [activities, setActivities] = useState([]);
  const [allActivitiesCache, setAllActivitiesCache] = useState(null); // Cache all data
  const [current, setCurrent] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [likeCounts, setLikeCounts] = useState({});
  const [likedActivities, setLikedActivities] = useState({});
  const [weekOffset, setWeekOffset] = useState(0);

  // Function to calculate weekly stats for any week offset
  const calculateWeeklyStats = (activities, weekOffset) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of the target week
    const mondayOfWeek = new Date(now);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
    mondayOfWeek.setDate(now.getDate() - daysFromMonday + weekOffset * 7);
    mondayOfWeek.setHours(0, 0, 0, 0);

    // Calculate Sunday of the target week
    const sundayOfWeek = new Date(mondayOfWeek);
    sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
    sundayOfWeek.setHours(23, 59, 59, 999);

    console.log(`🗓️ Week calculation for offset ${weekOffset}:`, {
      now: now.toLocaleDateString(),
      currentDay: currentDay,
      daysFromMonday: daysFromMonday,
      mondayOfWeek: mondayOfWeek.toLocaleDateString(),
      sundayOfWeek: sundayOfWeek.toLocaleDateString(),
    });

    // Filter activities for target week only (Monday to Sunday)
    const weekActivities = activities.filter((a) => {
      if (a.type !== "Run") return false;
      const actDate = new Date(a.start_date_local);
      return actDate >= mondayOfWeek && actDate <= sundayOfWeek;
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
    const avgPace = totalDistance > 0 ? totalTime / (totalDistance / 1000) : 0; // sec/km

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
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
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

    return {
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
      mondayOfWeek,
      sundayOfWeek,
    };
  };

  // PROGRESSIVE LOADING: Show activities immediately, load like counts in background
  useEffect(() => {
    const fetchActivitiesFirst = async () => {
      try {
        setLoadingInitial(true);
        console.log("🚀 PROGRESSIVE: Fetching activities first...");

        // STEP 1: Fetch activities data immediately
        const response = await fetch("/api/strava?per_page=60");
        const data = await response.json();
        const arr = Array.isArray(data) ? data : [data];

        console.log("✅ PROGRESSIVE: Activities fetched:", arr.length, "total");

        // STEP 2: Show activities immediately (don't wait for like counts!)
        setAllActivitiesCache(arr);
        setActivities(arr.slice(0, 5));

        // STEP 3: Calculate and show weekly stats immediately
        const stats = calculateWeeklyStats(arr, weekOffset);
        setWeeklyStats(stats);

        // STEP 4: Hide loading state - show data now!
        setLoadingInitial(false);
        console.log("✅ PROGRESSIVE: Activities and stats shown immediately");

        // STEP 5: Load like counts in background (non-blocking)
        if (arr.length > 0) {
          console.log("🚀 PROGRESSIVE: Loading like counts in background...");
          const activityIds = arr.slice(0, 5).map((a) => a.id);
          const likePromises = activityIds.map((id) =>
            fetch(`/api/engagement/likes?activity_id=${id}`)
              .then((res) => res.json())
              .then((data) => ({ id, count: data.count || 0 }))
              .catch((error) => {
                console.error(
                  `Error fetching like count for activity ${id}:`,
                  error
                );
                return { id, count: 0 };
              })
          );

          const likeResults = await Promise.all(likePromises);
          const newLikeCounts = {};
          likeResults.forEach(({ id, count }) => {
            newLikeCounts[id] = count;
          });
          setLikeCounts(newLikeCounts);
          console.log(
            "✅ PROGRESSIVE: Like counts loaded in background:",
            Object.keys(newLikeCounts).length
          );
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoadingInitial(false);
      }
    };

    fetchActivitiesFirst();
  }, []); // Only run once on mount
  // OPTIMIZED: Use cached data for week offset changes instead of refetching
  useEffect(() => {
    if (!allActivitiesCache) return;

    console.log("🚀 OPTIMIZED: Using cached data for week offset:", weekOffset);
    setLoadingWeekly(true);

    // Use cached data instead of refetching from API
    const stats = calculateWeeklyStats(allActivitiesCache, weekOffset);
    setWeeklyStats(stats);
    setLoadingWeekly(false);

    console.log("✅ OPTIMIZED: Week stats calculated from cache");
  }, [weekOffset, allActivitiesCache]);

  // Like button handler
  const handleLike = async (activityId) => {
    if (likedActivities[activityId]) return;

    try {
      const response = await fetch("/api/engagement/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_id: activityId }),
      });

      const data = await response.json();

      if (response.ok) {
        setLikeCounts((prev) => ({ ...prev, [activityId]: data.count || 0 }));
        setLikedActivities((prev) => ({ ...prev, [activityId]: true }));
      } else {
        console.error("Failed to like activity:", data.error);
        console.error("Error details:", data.details);
        console.error("Error code:", data.code);
      }
    } catch (error) {
      console.error("Error liking activity:", error);
    }
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

  // Week navigation functions
  const goToPreviousWeek = () => {
    if (weekOffset > -4) {
      // Limit to 5 weeks back (0 to -4)
      setWeekOffset(weekOffset - 1);
    }
  };

  const goToNextWeek = () => {
    if (weekOffset < 0) {
      // Can't go beyond current week
      setWeekOffset(weekOffset + 1);
    }
  };

  // Get week title based on offset
  const getWeekTitle = () => {
    if (weekOffset === 0) return "Current Week";
    if (weekOffset === -1) return "Last Week";
    return `${Math.abs(weekOffset)} Weeks Ago`;
  };

  // Get week date range
  const getWeekDateRange = () => {
    if (!weeklyStats || !weeklyStats.mondayOfWeek || !weeklyStats.sundayOfWeek)
      return "";
    const monday = weeklyStats.mondayOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const sunday = weeklyStats.sundayOfWeek.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${monday} - ${sunday}`;
  };

  // Swipe handlers for activity card
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrent((current + 1) % activities.length),
    onSwipedRight: () =>
      setCurrent((current - 1 + activities.length) % activities.length),
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 30,
  });

  // Always show the page content - only show loading for dynamic sections

  return (
    <div className={styles.container}>
      <InfoCard
        title="Latest Runs"
        size="medium"
        Icon={SiStrava}
        details={
          loadingInitial ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading activities…</div>
            </div>
          ) : activities.length ? (
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
              <div className={styles.activityArrowsContainer}>
                <button
                  onClick={() =>
                    setCurrent(
                      (current - 1 + activities.length) % activities.length
                    )
                  }
                  disabled={activities.length < 2}
                  className={styles.weekNavBtn}
                  aria-label="Previous activity"
                >
                  <FiChevronLeft size={14} />
                </button>
                <span className={styles.carouselCounter}>
                  {current + 1} / {activities.length}
                </span>
                <button
                  onClick={() => setCurrent((current + 1) % activities.length)}
                  disabled={activities.length < 2}
                  className={styles.weekNavBtn}
                  aria-label="Next activity"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <div className={styles.loadingText}>No activities found</div>
            </div>
          )
        }
      />
      <InfoCard
        title={
          <div className={styles.weekTitleWithDate}>
            <div className={styles.weekTitle}>{getWeekTitle()}</div>
            {getWeekDateRange() && (
              <div className={styles.weekDateUnderTitle}>
                {getWeekDateRange()}
              </div>
            )}
          </div>
        }
        size="medium"
        Icon={BarChartIcon}
        details={
          loadingInitial || loadingWeekly ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading weekly stats…</div>
            </div>
          ) : weeklyStats ? (
            <div>
              {/* Week Navigation Arrows */}
              <div className={styles.weekArrowsContainer}>
                <button
                  onClick={goToPreviousWeek}
                  disabled={weekOffset <= -4}
                  className={styles.weekNavBtn}
                  title="Previous week"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  onClick={goToNextWeek}
                  disabled={weekOffset >= 0}
                  className={styles.weekNavBtn}
                  title="Next week"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
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
                  <span className={styles.statValue}>
                    {weeklyStats.numRuns}
                  </span>
                </div>
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
          loadingInitial || loadingWeekly ? (
            <div style={{ padding: "1.5rem 0", textAlign: "center" }}>
              <span className={styles.loader} />
              <div className={styles.loadingText}>Loading weekly analysis…</div>
            </div>
          ) : (
            <WeeklyAnalysisChart
              weekActivities={weeklyStats?.weekActivities || []}
            />
          )
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
              I'm a committed long-distance runner based in Germany,
              specializing in road races from the 5K to the half-marathon. My
              journey in running started with curiosity and quickly turned into
              a deep passion — one that now shapes how I live, think, and train.
            </p>
            <br />
            <p>
              Running, for me, is not just about chasing fast times. It's a
              lifestyle grounded in consistency, discipline, and
              self-improvement. I train year-round, covering high weekly
              mileage, balancing structured workouts with recovery, and always
              looking for ways to refine my approach.
            </p>
            <br />
            <p>
              What drives me is the challenge — the process of becoming
              stronger, smarter, and more resilient with every cycle. Each race
              is a checkpoint, not a finish line, in a long journey of growth. I
              see running as both an art and a science — a craft that demands
              patience, intention, and heart.
            </p>
            <br />
            <p>
              Want to see my detailed training plans, workouts, and progress
              tracking? Check out my comprehensive training dashboard where I
              share my complete training methodology and current training cycle.
            </p>
            <br />
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
    avgDistance: 0,
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
    if (a.average_heartrate) {
      if (!data[dayIdx].hrSum) data[dayIdx].hrSum = 0;
      if (!data[dayIdx].hrCount) data[dayIdx].hrCount = 0;
      data[dayIdx].hrSum += a.average_heartrate;
      data[dayIdx].hrCount += 1;
    }
  });
  // Set distance line and avgHR
  data.forEach((d) => {
    d.avgDistance = d.distance; // Line shows each day's total distance
    d.avgHR = d.hrCount > 0 ? Math.round(d.hrSum / d.hrCount) : null;
    delete d.hrSum;
    delete d.hrCount;
  });
  return data;
}

function WeeklyAnalysisChart({ weekActivities }) {
  const chartData = getWeeklyChartData(weekActivities);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const distance = payload[0]?.value || 0;
      const runs = payload[0]?.payload?.runs || 0;
      const avgDistance = payload[0]?.payload?.avgDistance || 0;

      return (
        <div
          style={{
            backgroundColor: "var(--background-dark)",
            border: "1px solid var(--card-border)",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              fontWeight: "bold",
              color: "var(--text-light)",
            }}
          >
            {label}
          </p>
          <p style={{ margin: "0 0 4px 0", color: "var(--text-dark)" }}>
            Distance:{" "}
            <span style={{ color: "var(--primary-color)", fontWeight: "bold" }}>
              {distance.toFixed(2)} km
            </span>
          </p>
          <p style={{ margin: "0", color: "var(--text-dark)" }}>
            Runs:{" "}
            <span style={{ color: "var(--primary-color)", fontWeight: "bold" }}>
              {runs}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

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
          <Tooltip content={<CustomTooltip />} />
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
            dataKey="avgDistance"
            name="Distance Line"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
