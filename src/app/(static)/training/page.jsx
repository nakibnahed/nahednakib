"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./training.module.css";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Activity,
  Target,
  MapPin,
} from "lucide-react";

export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dayActivities, setDayActivities] = useState([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [cellStravaData, setCellStravaData] = useState({});
  const [today, setToday] = useState(new Date());
  const weekRefs = useRef({});

  // Function to find today's month and week in the training data
  const findTodayInCalendar = (data = trainingData) => {
    const todayDate = new Date();

    if (!data || data.length === 0) {
      return { month: 6, week: 0 }; // Current month is at index 6
    }

    // Check all months to find today
    for (let monthIndex = 0; monthIndex < data.length; monthIndex++) {
      const monthData = data[monthIndex];
      if (!monthData) continue;

      for (let weekIndex = 0; weekIndex < monthData.weeks.length; weekIndex++) {
        const weekData = monthData.weeks[weekIndex];
        const [year, monthNum, day] = weekData.weekStart.split("-").map(Number);
        const weekStart = new Date(year, monthNum - 1, day);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        if (todayDate >= weekStart && todayDate <= weekEnd) {
          return { month: monthIndex, week: weekIndex };
        }
      }
    }

    // If not found anywhere, return current month (index 6)
    return { month: 6, week: 0 };
  };

  // Generate real-time training data starting from current month
  const generateTrainingData = () => {
    const months = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Generate 18 months: 6 months back + current + 11 months forward
    for (let i = -6; i < 12; i++) {
      const monthDate = new Date(currentYear, currentMonth + i, 1);
      const monthName = monthDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      // Generate weeks for this month - always start with Monday and show complete month
      const weeks = [];
      const firstDay = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      );
      const lastDay = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );

      // Find the Monday of the first week (may be from previous month)
      const startOfFirstWeek = new Date(firstDay);
      const dayOfWeek = firstDay.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as well
      startOfFirstWeek.setDate(firstDay.getDate() + mondayOffset);

      // Find the Sunday of the last week (may be from next month)
      const endOfLastWeek = new Date(lastDay);
      const lastDayOfWeek = lastDay.getDay();
      const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
      endOfLastWeek.setDate(lastDay.getDate() + sundayOffset);

      let weekStart = new Date(startOfFirstWeek);
      let weekNumber =
        Math.floor(
          (weekStart.getTime() - new Date(2025, 0, 6).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        ) + 1;

      // Generate all weeks from first Monday to last Sunday of the month
      while (weekStart <= endOfLastWeek) {
        // Store weekStart as YYYY-MM-DD format (avoiding timezone issues)
        const year = weekStart.getFullYear();
        const month = String(weekStart.getMonth() + 1).padStart(2, "0");
        const day = String(weekStart.getDate()).padStart(2, "0");
        const weekStartString = `${year}-${month}-${day}`;

        weeks.push({
          week: weekNumber,
          weekStart: weekStartString,
          days: generateEmptyWeekData(new Date(weekStart)),
        });

        weekStart.setDate(weekStart.getDate() + 7);
        weekNumber++;
      }

      months.push({
        month: i + 6, // Adjust index since we start from -6
        monthName: monthName,
        weeks: weeks,
      });
    }

    return months;
  };

  // Generate empty week data (just dates, no training) - will be populated with Strava data
  const generateEmptyWeekData = (weekStart) => {
    const days = {};
    const dayKeys = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    dayKeys.forEach((dayKey) => {
      days[dayKey] = {
        type: "",
        distance: "",
        duration: "",
        pace: "",
        notes: "",
        intensity: "rest",
        location: "",
        isEmpty: true, // Flag to identify empty cells that should show Strava data
      };
    });

    return days;
  };

  const isToday = (monthIndex, weekIndex, dayKey) => {
    if (!trainingData[monthIndex]?.weeks[weekIndex]) return false;

    const weekData = trainingData[monthIndex].weeks[weekIndex];
    const [year, monthNum, day] = weekData.weekStart.split("-").map(Number);
    const weekStart = new Date(year, monthNum - 1, day);
    const dayKeys = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayIndex = dayKeys.indexOf(dayKey);

    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);

    const todayDate = new Date();
    return dayDate.toDateString() === todayDate.toDateString();
  };

  useEffect(() => {
    // Generate real-time training data
    const realTimeData = generateTrainingData();

    // console.log("Generated training data:", realTimeData);

    // Debug: Log the first week to see what's happening
    if (realTimeData.length > 0 && realTimeData[0].weeks.length > 0) {
      const firstWeek = realTimeData[0].weeks[0];
      console.log("First week start:", firstWeek.weekStart);
      const weekStart = new Date(firstWeek.weekStart);
      console.log(
        "Week start day:",
        weekStart.getDay(),
        weekStart.toDateString()
      );

      // Log each day of the first week
      const dayKeys = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      dayKeys.forEach((dayKey, index) => {
        const cellDate = new Date(weekStart);
        cellDate.setDate(weekStart.getDate() + index);
        console.log(
          `${dayKey} (index ${index}):`,
          cellDate.getDay(),
          cellDate.toDateString(),
          `-> key: ${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`
        );
      });
    }

    setTrainingData(realTimeData);

    // Set initial month and week to today's location
    const todayLocation = findTodayInCalendar(realTimeData);
    console.log("Today's location:", todayLocation);
    console.log("Current date:", new Date().toDateString());
    console.log("Setting current month to:", todayLocation.month);
    setCurrentMonth(todayLocation.month);
    setCurrentWeek(todayLocation.week);

    // Fetch Strava data for empty cells
    fetchCellStravaData();

    setLoading(false);

    // Auto-scroll to today's week on page load
    setTimeout(() => {
      const weekKey = `${todayLocation.month}-${todayLocation.week}`;
      const weekElement = weekRefs.current[weekKey];
      if (weekElement) {
        weekElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);

    // Update today's date every minute
    const interval = setInterval(() => {
      setToday(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Control body scroll when modal opens/closes
  useEffect(() => {
    if (selectedDay) {
      // Modal is open - prevent background scroll
      document.body.style.overflow = "hidden";
    } else {
      // Modal is closed - restore background scroll
      document.body.style.overflow = "unset";
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedDay]);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const dayKeys = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      case "rest":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getIntensityIcon = (type) => {
    if (type.toLowerCase().includes("rest")) return "😴";
    if (
      type.toLowerCase().includes("interval") ||
      type.toLowerCase().includes("speed")
    )
      return "🔥";
    if (
      type.toLowerCase().includes("tempo") ||
      type.toLowerCase().includes("threshold")
    )
      return "⚡";
    if (type.toLowerCase().includes("long")) return "🏃‍♂️";
    if (type.toLowerCase().includes("strava")) return "🏃";
    return "🏃";
  };

  const hasStravaActivity = (monthIndex, weekIndex, dayKey) => {
    // Check if there's Strava activity for this day
    const dayKeys = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayIndex = dayKeys.indexOf(dayKey);
    const weekData = trainingData[monthIndex]?.weeks[weekIndex];

    if (weekData) {
      const [year, monthNum, day] = weekData.weekStart.split("-").map(Number);
      const weekStartDate = new Date(year, monthNum - 1, day);
      const cellDate = new Date(weekStartDate);
      cellDate.setDate(weekStartDate.getDate() + dayIndex);

      const stravaData = getStravaDataForDate(cellDate);
      return !!stravaData;
    }

    return false;
  };

  const openDayDetails = (monthIndex, weekIndex, dayKey) => {
    const dayData = trainingData[monthIndex]?.weeks[weekIndex]?.days[dayKey];
    const weekData = trainingData[monthIndex]?.weeks[weekIndex];

    if (dayData && weekData) {
      // Calculate the actual date for this day
      const dayKeys = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const dayIndex = dayKeys.indexOf(dayKey);
      const [year, monthNum, day] = weekData.weekStart.split("-").map(Number);
      const weekStartDate = new Date(year, monthNum - 1, day);
      const cellDate = new Date(weekStartDate);
      cellDate.setDate(weekStartDate.getDate() + dayIndex);

      // Check if there's Strava activity for this date
      const stravaData = getStravaDataForDate(cellDate);
      const hasStrava = !!stravaData;

      // Check if has Strava activity
      const hasActivity = hasStravaActivity(monthIndex, weekIndex, dayKey);

      // Format the full date
      const fullDayName = cellDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const fullDate = cellDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Set title based on available data
      let title = "Rest Day";
      let intensity = "rest";

      // If has Strava data, use Strava activity name
      if (hasStrava) {
        title = stravaData.name || "Strava Activity";
        intensity = "strava";
      }

      setSelectedDay({
        ...dayData,
        type: title,
        intensity: intensity,
        month: monthIndex,
        week: weekIndex + 1,
        day: dayKey,
        hasActivity: hasActivity,
        monthIndex: monthIndex,
        weekIndex: weekIndex,
        fullDayName: fullDayName,
        fullDate: fullDate,
        dateString: `${fullDayName}, ${fullDate}`,
        actualDate: cellDate, // Store the actual date for Strava fetching
      });

      // Fetch Strava activity for this date
      fetchDayActivity(cellDate);
    }
  };

  const closeDayDetails = () => {
    setSelectedDay(null);
    setDayActivities([]);
    setCurrentActivityIndex(0);
  };

  // Fetch Strava activities for a specific date
  const fetchDayActivity = async (date) => {
    setLoadingActivity(true);
    setCurrentActivityIndex(0);
    try {
      // Fetch more activities to get historical data (increased to 200)
      const response = await fetch("/api/strava?per_page=200");
      const activities = await response.json();

      if (Array.isArray(activities) && activities.length > 0) {
        // Find all activities for the specific date using proper date comparison
        const targetDate = new Date(date);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        const targetDay = targetDate.getDate();

        // Get all activities for this date (public and private)
        const allDayActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.start_date_local);
          const activityYear = activityDate.getFullYear();
          const activityMonth = activityDate.getMonth();
          const activityDay = activityDate.getDate();

          return (
            activityYear === targetYear &&
            activityMonth === targetMonth &&
            activityDay === targetDay
          );
        });

        // Get public activities for this date
        const publicDayActivities = allDayActivities.filter(
          (activity) => !activity.private
        );

        console.log(
          `Found ${publicDayActivities.length} public activities and ${
            allDayActivities.length
          } total activities for ${targetYear}-${targetMonth + 1}-${targetDay}`
        );

        if (publicDayActivities.length > 0) {
          // Show public activities
          setDayActivities(publicDayActivities);
        } else if (allDayActivities.length > 0) {
          // Only private activities - create a summary
          const totalDistance = allDayActivities.reduce(
            (sum, activity) => sum + (activity.distance || 0),
            0
          );
          const totalTime = allDayActivities.reduce(
            (sum, activity) => sum + (activity.moving_time || 0),
            0
          );
          const activityCount = allDayActivities.length;

          // Calculate average pace (only if we have both distance and time)
          const avgSpeed =
            totalDistance > 0 && totalTime > 0 ? totalDistance / totalTime : 0;

          // Create a summary activity for the modal
          const summaryActivity = {
            name: activityCount === 1 ? "Activity" : "Activities",
            distance: totalDistance,
            moving_time: totalTime,
            average_speed: avgSpeed,
            type: "training_summary",
            start_date_local: allDayActivities[0].start_date_local,
            isPrivateSummary: true,
            // Add some additional fields that might be expected
            id: "private_summary",
            private: false,
          };

          setDayActivities([summaryActivity]);
        } else {
          setDayActivities([]);
        }
      } else {
        setDayActivities([]);
      }
    } catch (error) {
      console.error("Error fetching day activities:", error);
      setDayActivities([]);
    }
    setLoadingActivity(false);
  };

  // Navigation between activities
  const nextActivity = () => {
    if (currentActivityIndex < dayActivities.length - 1) {
      setCurrentActivityIndex(currentActivityIndex + 1);
    }
  };

  const prevActivity = () => {
    if (currentActivityIndex > 0) {
      setCurrentActivityIndex(currentActivityIndex - 1);
    }
  };

  // Fetch Strava data for calendar cells
  const fetchCellStravaData = async () => {
    try {
      console.log("Fetching Strava data...");
      const response = await fetch("/api/strava?per_page=200");
      const activities = await response.json();

      console.log("Raw activities:", activities.length);

      if (Array.isArray(activities) && activities.length > 0) {
        const publicActivities = activities.filter(
          (activity) => !activity.private
        );
        const stravaDataMap = {};

        // Group all activities by date to calculate totals for private-only days
        const activitiesByDate = {};

        activities.forEach((activity) => {
          const activityDate = new Date(activity.start_date_local);
          const dateKey = `${activityDate.getFullYear()}-${activityDate.getMonth()}-${activityDate.getDate()}`;

          if (!activitiesByDate[dateKey]) {
            activitiesByDate[dateKey] = [];
          }
          activitiesByDate[dateKey].push(activity);
        });

        // Process each date
        Object.keys(activitiesByDate).forEach((dateKey) => {
          const dayActivities = activitiesByDate[dateKey];
          const publicDayActivities = dayActivities.filter(
            (activity) => !activity.private
          );

          if (publicDayActivities.length > 0) {
            // Has public activities - show the first public one
            console.log(
              `Public activity: ${publicDayActivities[0].name} on ${dateKey}`
            );
            stravaDataMap[dateKey] = publicDayActivities[0];
          } else if (dayActivities.length > 0) {
            // Only private activities - create a totals summary
            const totalDistance = dayActivities.reduce(
              (sum, activity) => sum + (activity.distance || 0),
              0
            );
            const totalTime = dayActivities.reduce(
              (sum, activity) => sum + (activity.moving_time || 0),
              0
            );
            const activityCount = dayActivities.length;

            // Calculate average pace (only if we have both distance and time)
            const avgSpeed =
              totalDistance > 0 && totalTime > 0
                ? totalDistance / totalTime
                : 0;

            console.log(
              `Private activities total on ${dateKey}: ${activityCount} activities, ${(
                totalDistance / 1000
              ).toFixed(2)}km`
            );

            // Create a summary object that looks like a normal activity
            stravaDataMap[dateKey] = {
              name: activityCount === 1 ? "Activity" : "Activities",
              distance: totalDistance,
              moving_time: totalTime,
              average_speed: avgSpeed,
              type: "training_summary",
              private: false, // Mark as not private so it shows up
              start_date_local: dayActivities[0].start_date_local,
              isPrivateSummary: true, // Flag to identify this as a summary
            };
          }
        });

        console.log("Strava data map:", stravaDataMap);
        setCellStravaData(stravaDataMap);
      }
    } catch (error) {
      console.error("Error fetching cell Strava data:", error);
    }
  };

  // Get Strava data for a specific date
  const getStravaDataForDate = (date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const data = cellStravaData[dateKey];

    // Debug logs removed

    if (data) {
      console.log(
        `Found Strava data for ${date.toDateString()} (key: ${dateKey}):`,
        data.name
      );
    }

    return data;
  };

  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Format pace
  const formatPace = (metersPerSecond) => {
    if (!metersPerSecond) return "N/A";
    const secondsPerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
  };

  // Format activity time with proper day
  const formatActivityTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();

    // Check if it's today
    const isToday = date.toDateString() === today.toDateString();

    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      // For other days, show the day name and date
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      const dateStr = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      });
      return `${dayName}, ${dateStr} at ${time}`;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loader}></div>
          <p>Loading training schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Back to previous (outside calendar header) */}
      <div className={styles.backNav}>
        <Link href="/info" className={styles.backNavButton} aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Training Calendar Table - Monthly View */}
      {trainingData[currentMonth] && (
        <div className={styles.calendarContainer}>
          <div className={styles.weekHeader}>
            <div className={styles.monthNavigation}>
              <div className={styles.headerLeft}>
                <div className={styles.monthGroup}>
                  <h2 className={styles.monthTitle}>
                    {trainingData[currentMonth].monthName}
                  </h2>
                </div>
              </div>
              <div className={styles.headerCenter}>
                <div className={styles.calendarTitle}>Training Program</div>
              </div>
              <div className={styles.navigationButtons}>
                <button
                  onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                  disabled={currentMonth === 0}
                  className={styles.navArrow}
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    const todayLocation = findTodayInCalendar(trainingData);
                    setCurrentMonth(todayLocation.month);
                    setCurrentWeek(todayLocation.week);

                    // Scroll to the week after a short delay to ensure state updates
                    setTimeout(() => {
                      const weekKey = `${todayLocation.month}-${todayLocation.week}`;
                      const weekElement = weekRefs.current[weekKey];
                      if (weekElement) {
                        weekElement.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }, 100);
                  }}
                  className={styles.todayButton}
                >
                  Today
                </button>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      Math.min(trainingData.length - 1, currentMonth + 1)
                    )
                  }
                  disabled={currentMonth === trainingData.length - 1}
                  className={styles.navArrow}
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          <div className={styles.calendarTable}>
            {/* Header Row */}
            <div className={styles.headerRow}>
              <div className={styles.weekColumnHeader}>Week</div>
              {daysOfWeek.map((day) => (
                <div key={day} className={styles.dayHeader}>
                  {day}
                </div>
              ))}
            </div>

            {/* All Training Weeks */}
            {trainingData[currentMonth].weeks.map((weekData, weekIndex) => (
              <div
                key={weekIndex}
                className={styles.trainingRow}
                ref={(el) => {
                  const weekKey = `${currentMonth}-${weekIndex}`;
                  weekRefs.current[weekKey] = el;
                }}
              >
                {/* Week Date Range Column */}
                <div className={styles.weekColumn}>
                  <div className={styles.weekDateRange}>
                    {(() => {
                      const [year, monthNum, day] = weekData.weekStart
                        .split("-")
                        .map(Number);
                      const startDate = new Date(year, monthNum - 1, day); // This is always Monday
                      const endDate = new Date(startDate);
                      endDate.setDate(startDate.getDate() + 6); // Sunday

                      const startDay = startDate.getDate();
                      const endDay = endDate.getDate();

                      // Handle month boundary - show month of the start date
                      const month = startDate.toLocaleDateString("en-US", {
                        month: "long",
                      });

                      return (
                        <>
                          <div className={styles.dateRange}>
                            {startDay} - {endDay}
                          </div>
                          <div className={styles.monthName}>{month}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Training Days */}
                <div className={styles.daysContainer}>
                  {dayKeys.map((dayKey, index) => {
                    const dayData = weekData.days[dayKey];
                    const hasActivity = hasStravaActivity(
                      currentMonth,
                      weekIndex,
                      dayKey
                    );
                    const isTodayCell = isToday(
                      currentMonth,
                      weekIndex,
                      dayKey
                    );

                    // Calculate actual date for this cell
                    // weekStart should be Monday, so we add index days to get the correct day
                    const [year, monthNum, day] = weekData.weekStart
                      .split("-")
                      .map(Number);
                    const weekStartDate = new Date(year, monthNum - 1, day); // month is 0-indexed
                    const cellDate = new Date(weekStartDate);
                    cellDate.setDate(weekStartDate.getDate() + index);

                    const dayName = cellDate.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const dateNumber = cellDate.getDate();

                    // Check if this date belongs to the current month
                    const currentMonthData = trainingData[currentMonth];
                    const isCurrentMonth =
                      cellDate.getMonth() ===
                      new Date(
                        currentMonthData.monthName +
                          " 1, " +
                          cellDate.getFullYear()
                      ).getMonth();

                    // Check if this is the first day of any month
                    const isFirstDayOfMonth = cellDate.getDate() === 1;

                    return (
                      <div
                        key={dayKey}
                        className={`${styles.dayCell} ${
                          isTodayCell ? styles.today : ""
                        } ${!isCurrentMonth ? styles.otherMonth : ""} ${
                          isFirstDayOfMonth && isCurrentMonth
                            ? styles.firstDayOfMonth
                            : ""
                        }`}
                        onClick={() =>
                          isCurrentMonth
                            ? openDayDetails(currentMonth, weekIndex, dayKey)
                            : null
                        }
                        onMouseDown={(e) => {
                          // Fallback for Chrome iOS - sometimes mousedown works better
                          if (isCurrentMonth) {
                            e.currentTarget.mouseDownStarted = true;
                            console.log("Mouse down on:", dayKey, dateNumber);
                          }
                        }}
                        onMouseUp={(e) => {
                          // Fallback mouse handling for Chrome iOS
                          if (
                            e.currentTarget.mouseDownStarted &&
                            isCurrentMonth
                          ) {
                            e.currentTarget.mouseDownStarted = false;
                            console.log(
                              "Mouse up - opening modal for:",
                              dayKey,
                              dateNumber
                            );
                            openDayDetails(currentMonth, weekIndex, dayKey);
                          }
                        }}
                        onTouchStart={(e) => {
                          // Chrome iOS fix - don't prevent default on touchstart
                          e.currentTarget.touchStarted = true;
                          e.currentTarget.touchStartTime = Date.now();
                          console.log("Touch start on:", dayKey, dateNumber);
                        }}
                        onTouchMove={(e) => {
                          // If user moves too much, cancel the touch
                          const touch = e.touches[0];
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = touch.clientX - rect.left;
                          const y = touch.clientY - rect.top;

                          if (
                            x < 0 ||
                            x > rect.width ||
                            y < 0 ||
                            y > rect.height
                          ) {
                            e.currentTarget.touchStarted = false;
                          }
                        }}
                        onTouchEnd={(e) => {
                          console.log(
                            "Touch end on:",
                            dayKey,
                            dateNumber,
                            "isCurrentMonth:",
                            isCurrentMonth
                          );

                          // Chrome iOS specific handling
                          if (e.currentTarget.touchStarted && isCurrentMonth) {
                            const touchDuration =
                              Date.now() -
                              (e.currentTarget.touchStartTime || 0);

                            // Only handle quick taps (not long presses)
                            if (touchDuration < 500) {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.touchStarted = false;

                              console.log(
                                "Opening modal for:",
                                dayKey,
                                dateNumber
                              );

                              // Visual feedback for Chrome iOS
                              const element = e.currentTarget;
                              element.style.backgroundColor =
                                "rgba(238, 104, 26, 0.1)";

                              setTimeout(() => {
                                element.style.backgroundColor = "";
                                openDayDetails(currentMonth, weekIndex, dayKey);
                              }, 100);
                            }
                          }
                        }}
                        onTouchCancel={(e) => {
                          e.currentTarget.touchStarted = false;
                        }}
                        style={{
                          borderLeft: `4px solid ${getIntensityColor(
                            dayData.intensity
                          )}`,
                          opacity: isCurrentMonth ? 1 : 0.3,
                          cursor: isCurrentMonth ? "pointer" : "default",
                        }}
                      >
                        {isTodayCell && (
                          <>
                            <div className={styles.todayIndicator}></div>
                            <span className={styles.todayText}>Today</span>
                          </>
                        )}
                        {isFirstDayOfMonth &&
                          isCurrentMonth &&
                          !isTodayCell && (
                            <div className={styles.firstDayIndicator}>
                              <span className={styles.firstDayDot}></span>
                            </div>
                          )}
                        {getStravaDataForDate(cellDate) && (
                          <span className={styles.stravaCompletedBadge}>✓</span>
                        )}
                        <div className={styles.cellDate}>
                          <span className={styles.dayName}>{dayName}</span>
                          <span className={styles.dateNumber}>
                            {dateNumber}
                          </span>
                        </div>
                        <div className={styles.dayContent}>
                          {(() => {
                            // Check for Strava data for this date
                            const stravaData = getStravaDataForDate(cellDate);
                            if (stravaData) {
                              if (stravaData.isPrivateSummary) {
                                // Show training summary (looks like normal activity)
                                return (
                                  <div className={styles.stravaCell}>
                                    <div className={styles.stravaCellHeader}>
                                      <span className={styles.stravaIcon}>
                                        🏃
                                      </span>
                                      <span
                                        className={styles.stravaActivityName}
                                      >
                                        {stravaData.name}
                                      </span>
                                    </div>
                                    <div className={styles.stravaStats}>
                                      <div className={styles.stravaDistance}>
                                        {(stravaData.distance / 1000).toFixed(
                                          2
                                        )}{" "}
                                        km
                                      </div>
                                      <div className={styles.stravaDuration}>
                                        {formatTime(stravaData.moving_time)}
                                      </div>
                                      {stravaData.average_speed > 0 && (
                                        <div className={styles.stravaPace}>
                                          {formatPace(stravaData.average_speed)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              } else {
                                // Show regular public Strava data
                                const activityTime = new Date(
                                  stravaData.start_date_local
                                );
                                const timeStr = activityTime.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                );

                                return (
                                  <div className={styles.stravaCell}>
                                    <div className={styles.stravaCellHeader}>
                                      <span className={styles.stravaIcon}>
                                        🏃
                                      </span>
                                      <span
                                        className={styles.stravaActivityName}
                                      >
                                        {stravaData.name}
                                      </span>
                                    </div>
                                    <div className={styles.stravaTime}>
                                      at {timeStr}
                                    </div>
                                    <div className={styles.stravaStats}>
                                      <div className={styles.stravaDistance}>
                                        {(stravaData.distance / 1000).toFixed(
                                          2
                                        )}{" "}
                                        km
                                      </div>
                                      <div className={styles.stravaDuration}>
                                        {formatTime(stravaData.moving_time)}
                                      </div>
                                      <div className={styles.stravaPace}>
                                        {formatPace(stravaData.average_speed)}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                            // Empty cell with no Strava data - show nothing
                            return null;
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDay && (
        <div className={styles.modal} onClick={closeDayDetails}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <h3>
                  <span className={styles.modalIcon}>
                    {getIntensityIcon(selectedDay.type)}
                  </span>
                  {selectedDay.type}
                </h3>
                <div className={styles.modalDate}>{selectedDay.dateString}</div>
              </div>
              <button onClick={closeDayDetails} className={styles.closeButton}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Strava Activity Section */}
              {loadingActivity && (
                <div className={styles.stravaSection}>
                  <h4>📊 Strava Activity</h4>
                  <div className={styles.loadingActivity}>
                    Loading activity data...
                  </div>
                </div>
              )}

              {!loadingActivity && dayActivities.length > 0 && (
                <div className={styles.stravaSection}>
                  <div className={styles.stravaHeader}>
                    <h4>📊 Strava Activity</h4>
                    {dayActivities.length > 1 && (
                      <div className={styles.activityNavigation}>
                        <button
                          onClick={prevActivity}
                          disabled={currentActivityIndex === 0}
                          className={styles.navActivityButton}
                        >
                          ‹
                        </button>
                        <span className={styles.activityCounter}>
                          {currentActivityIndex + 1} of {dayActivities.length}
                        </span>
                        <button
                          onClick={nextActivity}
                          disabled={
                            currentActivityIndex === dayActivities.length - 1
                          }
                          className={styles.navActivityButton}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.stravaActivity}>
                    <div className={styles.activityHeader}>
                      <div className={styles.activityTime}>
                        {formatActivityTime(
                          dayActivities[currentActivityIndex].start_date_local
                        )}
                      </div>
                      <div className={styles.activityName}>
                        {dayActivities[currentActivityIndex].name}
                      </div>
                    </div>
                    <div className={styles.activityStats}>
                      <div className={styles.activityStat}>
                        <span className={styles.statLabel}>Distance:</span>
                        <span className={styles.statValue}>
                          {(
                            dayActivities[currentActivityIndex].distance / 1000
                          ).toFixed(2)}{" "}
                          km
                        </span>
                      </div>
                      <div className={styles.activityStat}>
                        <span className={styles.statLabel}>Time:</span>
                        <span className={styles.statValue}>
                          {formatTime(
                            dayActivities[currentActivityIndex].moving_time
                          )}
                        </span>
                      </div>
                      <div className={styles.activityStat}>
                        <span className={styles.statLabel}>Avg Pace:</span>
                        <span className={styles.statValue}>
                          {formatPace(
                            dayActivities[currentActivityIndex].average_speed
                          )}
                        </span>
                      </div>
                      {dayActivities[currentActivityIndex]
                        .average_heartrate && (
                        <div className={styles.activityStat}>
                          <span className={styles.statLabel}>Avg HR:</span>
                          <span className={styles.statValue}>
                            {Math.round(
                              dayActivities[currentActivityIndex]
                                .average_heartrate
                            )}{" "}
                            bpm
                          </span>
                        </div>
                      )}
                    </div>
                    <a
                      href={`https://www.strava.com/activities/${dayActivities[currentActivityIndex].id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.stravaButton}
                    >
                      View Full Activity on Strava
                    </a>
                  </div>
                </div>
              )}

              {!loadingActivity &&
                dayActivities.length === 0 &&
                selectedDay.type && (
                  <div className={styles.stravaSection}>
                    <h4>📊 Strava Activity</h4>
                    <div className={styles.noActivity}>
                      No public Strava activities found for this date
                    </div>
                  </div>
                )}

              {/* Only show notes if it's a rest day without Strava activity */}
              {!dayActivities.length && selectedDay.intensity === "rest" && (
                <div className={styles.modalNotes}>
                  <h4>Notes:</h4>
                  <p>No activity recorded for this day.</p>
                </div>
              )}

              <div className={styles.modalActions}>
                {selectedDay.intensity !== "rest" && (
                  <div
                    className={styles.intensityBadge}
                    style={{
                      backgroundColor: getIntensityColor(selectedDay.intensity),
                      color: "white",
                    }}
                  >
                    {selectedDay.intensity === "strava"
                      ? "ACTIVITY"
                      : selectedDay.intensity.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
