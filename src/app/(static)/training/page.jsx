"use client";

import { useState, useEffect } from "react";
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
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedWorkouts, setCompletedWorkouts] = useState({});
  const [dayActivities, setDayActivities] = useState([]);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [cellStravaData, setCellStravaData] = useState({});
  const [today, setToday] = useState(new Date());

  // Generate real-time training data starting from current month
  const generateTrainingData = () => {
    const months = [];

    // July 2025 - Your real training program + empty weeks
    const julyWeeks = [
      {
        week: 1,
        weekStart: "2025-06-30", // Monday June 30 (covers July 1-6)
        days: generateEmptyWeekData(new Date("2025-06-30T00:00:00")),
      },
      {
        week: 2,
        weekStart: "2025-07-07", // Monday July 7-13
        days: generateEmptyWeekData(new Date("2025-07-07T00:00:00")),
      },
      {
        week: 3,
        weekStart: "2025-07-14", // Monday July 14 (Week 1: 14-20 July) - YOUR PROGRAM
        days: generateRealWeekData(new Date("2025-07-14T00:00:00"), 1),
      },
      {
        week: 4,
        weekStart: "2025-07-21", // Monday July 21 (Week 2: 21-27 July) - YOUR PROGRAM
        days: generateRealWeekData(new Date("2025-07-21T00:00:00"), 2),
      },
      {
        week: 5,
        weekStart: "2025-07-28", // Monday July 28 (Week 4: 28 July - 3 August) - YOUR PROGRAM
        days: generateRealWeekData(new Date("2025-07-28T00:00:00"), 4),
      },
    ];

    months.push({
      month: 0,
      monthName: "July 2025",
      weeks: julyWeeks,
    });

    // August 2025 - Your real training program continues + empty weeks
    const augustWeeks = [
      {
        week: 6,
        weekStart: "2025-08-04", // Monday August 4 (Week 5: 4-10 August) - YOUR PROGRAM
        days: generateRealWeekData(new Date("2025-08-04T00:00:00"), 5),
      },
      {
        week: 7,
        weekStart: "2025-08-11", // Monday August 11-17
        days: generateEmptyWeekData(new Date("2025-08-11T00:00:00")),
      },
      {
        week: 8,
        weekStart: "2025-08-18", // Monday August 18-24
        days: generateEmptyWeekData(new Date("2025-08-18T00:00:00")),
      },
      {
        week: 9,
        weekStart: "2025-08-25", // Monday August 25-31
        days: generateEmptyWeekData(new Date("2025-08-25T00:00:00")),
      },
    ];

    months.push({
      month: 1,
      monthName: "August 2025",
      weeks: augustWeeks,
    });

    // September 2025 - empty weeks (no training yet)
    const septemberWeeks = [
      {
        week: 10,
        weekStart: "2025-09-01", // Monday September 1-7
        days: generateEmptyWeekData(new Date("2025-09-01T00:00:00")),
      },
      {
        week: 11,
        weekStart: "2025-09-08", // Monday September 8-14
        days: generateEmptyWeekData(new Date("2025-09-08T00:00:00")),
      },
      {
        week: 12,
        weekStart: "2025-09-15", // Monday September 15-21
        days: generateEmptyWeekData(new Date("2025-09-15T00:00:00")),
      },
      {
        week: 13,
        weekStart: "2025-09-22", // Monday September 22-28
        days: generateEmptyWeekData(new Date("2025-09-22T00:00:00")),
      },
      {
        week: 14,
        weekStart: "2025-09-29", // Monday September 29 - October 5
        days: generateEmptyWeekData(new Date("2025-09-29T00:00:00")),
      },
    ];

    months.push({
      month: 2,
      monthName: "September 2025",
      weeks: septemberWeeks,
    });

    // October 2025 - empty weeks (no training yet)
    const octoberWeeks = [
      {
        week: 15,
        weekStart: "2025-10-06", // Monday October 6-12
        days: generateEmptyWeekData(new Date("2025-10-06T00:00:00")),
      },
      {
        week: 16,
        weekStart: "2025-10-13", // Monday October 13-19
        days: generateEmptyWeekData(new Date("2025-10-13T00:00:00")),
      },
      {
        week: 17,
        weekStart: "2025-10-20", // Monday October 20-26
        days: generateEmptyWeekData(new Date("2025-10-20T00:00:00")),
      },
      {
        week: 18,
        weekStart: "2025-10-27", // Monday October 27 - November 2
        days: generateEmptyWeekData(new Date("2025-10-27T00:00:00")),
      },
    ];

    months.push({
      month: 3,
      monthName: "October 2025",
      weeks: octoberWeeks,
    });

    // November 2025 - empty weeks (no training yet)
    const novemberWeeks = [
      {
        week: 19,
        weekStart: "2025-11-03", // Monday November 3-9
        days: generateEmptyWeekData(new Date("2025-11-03T00:00:00")),
      },
      {
        week: 20,
        weekStart: "2025-11-10", // Monday November 10-16
        days: generateEmptyWeekData(new Date("2025-11-10T00:00:00")),
      },
      {
        week: 21,
        weekStart: "2025-11-17", // Monday November 17-23
        days: generateEmptyWeekData(new Date("2025-11-17T00:00:00")),
      },
      {
        week: 22,
        weekStart: "2025-11-24", // Monday November 24-30
        days: generateEmptyWeekData(new Date("2025-11-24T00:00:00")),
      },
    ];

    months.push({
      month: 4,
      monthName: "November 2025",
      weeks: novemberWeeks,
    });

    // December 2025 - empty weeks (no training yet)
    const decemberWeeks = [
      {
        week: 23,
        weekStart: "2025-12-01", // Monday December 1-7
        days: generateEmptyWeekData(new Date("2025-12-01T00:00:00")),
      },
      {
        week: 24,
        weekStart: "2025-12-08", // Monday December 8-14
        days: generateEmptyWeekData(new Date("2025-12-08T00:00:00")),
      },
      {
        week: 25,
        weekStart: "2025-12-15", // Monday December 15-21
        days: generateEmptyWeekData(new Date("2025-12-15T00:00:00")),
      },
      {
        week: 26,
        weekStart: "2025-12-22", // Monday December 22-28
        days: generateEmptyWeekData(new Date("2025-12-22T00:00:00")),
      },
      {
        week: 27,
        weekStart: "2025-12-29", // Monday December 29 - January 4
        days: generateEmptyWeekData(new Date("2025-12-29T00:00:00")),
      },
    ];

    months.push({
      month: 5,
      monthName: "December 2025",
      weeks: decemberWeeks,
    });

    return months;
  };

  // Generate your real training data
  const generateRealWeekData = (weekStart, weekNumber) => {
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

    // Your real training program data
    const realTrainingData = {
      1: {
        // Week 1: 14-20 July 2025
        monday: {
          type: "Easy Run + Core",
          distance: "14 km",
          duration: "60-70 min",
          pace: "Easy pace",
          notes: "14km jog with core work",
          intensity: "low",
          location: "Streets",
          details: {
            warmup: "10min easy jog",
            mainSet: "14km easy jog + core work",
            intervals: [
              { distance: "14km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Core strengthening exercises",
          },
        },
        tuesday: {
          type: "Threshold Intervals",
          distance: "15 km",
          duration: "60-70 min",
          pace: "Threshold pace",
          notes: "6x1km threshold intervals",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "2-3km easy jog",
            mainSet: "6x1km threshold intervals",
            intervals: [{ distance: "1km", pace: "Threshold pace", reps: 6 }],
            rest: {
              betweenReps: "200m jog recovery",
              betweenSets: null,
            },
            cooldown: "2-3km easy jog + stretching",
          },
        },
        wednesday: {
          type: "Easy Run + Gymnastics",
          distance: "15 km",
          duration: "70-80 min",
          pace: "Easy pace",
          notes: "15km jog with gymnastics work",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "10min easy jog",
            mainSet: "15km easy jog + gymnastics",
            intervals: [
              { distance: "15km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Gymnastics and flexibility work",
          },
        },
        thursday: {
          type: "Easy Run + Fitness",
          distance: "12 km",
          duration: "55-65 min",
          pace: "Easy pace",
          notes: "12km jog with fitness work",
          intensity: "low",
          location: "Streets",
          details: {
            warmup: "10min easy jog",
            mainSet: "12km easy jog + fitness",
            intervals: [
              { distance: "12km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Fitness and strength work",
          },
        },
        friday: {
          type: "Threshold Intervals",
          distance: "13.4 km",
          duration: "55-65 min",
          pace: "Threshold pace",
          notes: "15x300m threshold intervals",
          intensity: "medium",
          location: "Track",
          details: {
            warmup: "2-3km easy jog + strides",
            mainSet: "15x300m threshold intervals",
            intervals: [{ distance: "300m", pace: "Threshold pace", reps: 15 }],
            rest: {
              betweenReps: "100m jog (45-60 seconds)",
              betweenSets: null,
            },
            cooldown: "2-3km easy jog + stretching",
          },
        },
        saturday: {
          type: "Easy Run + Gymnastics",
          distance: "15.5 km",
          duration: "75-85 min",
          pace: "Easy pace",
          notes: "15.5km jog with gymnastics work",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "10min easy jog",
            mainSet: "15.5km easy jog + gymnastics",
            intervals: [
              { distance: "15.5km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Gymnastics and flexibility work",
          },
        },
        sunday: {
          type: "Easy Run",
          distance: "13.5 km",
          duration: "60-70 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "10min easy jog",
            mainSet: "13.5km easy recovery run",
            intervals: [
              { distance: "13.5km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
      },
      2: {
        // Week 2: 21-27 July 2025
        monday: {
          type: "Easy Long Run",
          distance: "21-23 km",
          duration: "100-120 min",
          pace: "Easy pace",
          notes: "Easy long run",
          intensity: "medium",
          location: "Long route",
          details: {
            warmup: "10min easy jog",
            mainSet: "Long run 21-23km",
            intervals: [
              {
                distance: "21-23km",
                pace: "Easy conversational pace",
                reps: 1,
              },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Stretching and recovery",
          },
        },
        tuesday: {
          type: "Recovery Run",
          distance: "14 km",
          duration: "65-75 min",
          pace: "Recovery pace",
          notes: "14km recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "10min easy jog",
            mainSet: "14km easy recovery run",
            intervals: [
              { distance: "14km", pace: "Very easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        wednesday: {
          type: "Easy Run + Core",
          distance: "14 km",
          duration: "60-70 min",
          pace: "Easy pace",
          notes: "Jog with core work",
          intensity: "low",
          location: "Streets",
          details: {
            warmup: "10min easy jog",
            mainSet: "14km easy jog + core work",
            intervals: [
              { distance: "14km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Core strengthening exercises",
          },
        },
        thursday: {
          type: "Mixed Intervals",
          distance: "8-10 km",
          duration: "50-60 min",
          pace: "5K-Mile pace",
          notes: "5x800m / 400m intervals",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "2-3km easy jog + strides",
            mainSet: "5x800m / 400m intervals",
            intervals: [
              { distance: "800m", pace: "5K pace", reps: 5 },
              { distance: "400m", pace: "Mile pace", reps: 5 },
            ],
            rest: {
              betweenReps: "2.5min between reps",
              betweenSets: "Full lap between sets",
            },
            cooldown: "2-3km easy jog + stretching",
          },
        },
        friday: {
          type: "Easy Run + Training",
          distance: "10-12 km",
          duration: "50 min",
          pace: "Easy pace",
          notes: "Easy jog with full training session",
          intensity: "low",
          location: "Streets",
          details: {
            warmup: "10min easy jog",
            mainSet: "50min easy jog + training",
            intervals: [
              {
                distance: "10-12km",
                pace: "Easy conversational pace",
                reps: 1,
              },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Gymnastics + Fitness + Core work",
          },
        },
        saturday: {
          type: "Easy Run + Strides",
          distance: "14 km",
          duration: "60-70 min",
          pace: "Easy pace",
          notes: "Easy jog with strides",
          intensity: "low",
          location: "Streets",
          details: {
            warmup: "10min easy jog",
            mainSet: "14km easy jog + 5x100m strides",
            intervals: [
              { distance: "14km", pace: "Easy conversational pace", reps: 1 },
              { distance: "100m", pace: "Stride pace", reps: 5 },
            ],
            rest: {
              betweenReps: "Full recovery between strides",
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        sunday: {
          type: "Speed Session",
          distance: "8-10 km",
          duration: "45-55 min",
          pace: "Fast pace",
          notes: "10x200m speed intervals",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "2-3km easy jog + strides",
            mainSet: "10x200m speed intervals",
            intervals: [{ distance: "200m", pace: "Fast pace", reps: 10 }],
            rest: {
              betweenReps: "200m jog recovery",
              betweenSets: null,
            },
            cooldown: "2-3km easy jog + stretching",
          },
        },
      },
      4: {
        // Week 4: 28 July - 3 August 2025
        monday: {
          type: "Easy Run + Core",
          distance: "8-10 km",
          duration: "40 min",
          pace: "Easy pace",
          notes: "Easy run with core work",
          intensity: "low",
          location: "Streets",
          details: {
            warmup: "5min easy jog",
            mainSet: "40min easy run + core work",
            intervals: [
              { distance: "8-10km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Core strengthening exercises",
          },
        },
        tuesday: {
          type: "Tempo + Hills",
          distance: "12-14 km",
          duration: "55-65 min",
          pace: "Tempo pace",
          notes: "8km tempo + 8-10x100m hills",
          intensity: "medium",
          location: "Road + Hills",
          details: {
            warmup: "2km easy jog",
            mainSet: "8km tempo + 8-10x100m hills",
            intervals: [
              { distance: "8km", pace: "Tempo pace", reps: 1 },
              { distance: "100m", pace: "Hill sprint", reps: 10 },
            ],
            rest: {
              betweenReps: "Walk down recovery for hills",
              betweenSets: "5min easy jog between tempo and hills",
            },
            cooldown: "2km easy jog + stretching",
          },
        },
        wednesday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        thursday: {
          type: "Easy Run + Gymnastics",
          distance: "12 km",
          duration: "50-60 min",
          pace: "Easy pace",
          notes: "Easy jog with gymnastics work",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "10min easy jog",
            mainSet: "12km easy jog + gymnastics",
            intervals: [
              { distance: "12km", pace: "Easy conversational pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Gymnastics and flexibility work",
          },
        },
        friday: {
          type: "400m Intervals",
          distance: "8-10 km",
          duration: "45-50 min",
          pace: "Mile pace",
          notes: "10x400m intervals (90sec rest)",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "2-3km easy jog + strides",
            mainSet: "10x400m intervals",
            intervals: [{ distance: "400m", pace: "Mile pace", reps: 10 }],
            rest: {
              betweenReps: "90 seconds rest",
              betweenSets: null,
            },
            cooldown: "2-3km easy jog + stretching",
          },
        },
        saturday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        sunday: {
          type: "Long Run",
          distance: "21-25 km",
          duration: "100-130 min",
          pace: "Easy-Moderate pace",
          notes: "Long run",
          intensity: "medium",
          location: "Long route",
          details: {
            warmup: "10min easy jog",
            mainSet: "Long run 21-25km",
            intervals: [
              { distance: "21-25km", pace: "Easy to moderate pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Stretching and recovery",
          },
        },
      },
      5: {
        // Week 5: 4-10 August 2025
        monday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        tuesday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        wednesday: {
          type: "Complex Intervals",
          distance: "10-12 km",
          duration: "60-70 min",
          pace: "Mixed paces",
          notes: "Complex pyramid interval session",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "15min easy jog + strides",
            mainSet: "4x(600m + 400m + 300m + 200m)",
            intervals: [
              { distance: "600m", pace: "5K pace", reps: 4 },
              { distance: "400m", pace: "3K pace", reps: 4 },
              { distance: "300m", pace: "Mile pace", reps: 4 },
              { distance: "200m", pace: "800m pace", reps: 4 },
            ],
            rest: {
              betweenReps: "2.5min between reps",
              betweenSets: "4min between sets",
            },
            cooldown: "15min easy jog + stretching",
          },
        },
        thursday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        friday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
        saturday: {
          type: "1600m Intervals",
          distance: "12-15 km",
          duration: "70-80 min",
          pace: "10K pace",
          notes: "Long intervals with jog recovery",
          intensity: "medium",
          location: "Track",
          details: {
            warmup: "20min easy jog + strides",
            mainSet: "4x1600m intervals",
            intervals: [{ distance: "1600m", pace: "10K pace", reps: 4 }],
            rest: {
              betweenReps: "400m jog recovery",
              betweenSets: null,
            },
            cooldown: "15min easy jog + stretching",
          },
        },
        sunday: {
          type: "Easy Run",
          distance: "8-10 km",
          duration: "40-50 min",
          pace: "Easy pace",
          notes: "Easy recovery run",
          intensity: "low",
          location: "Park",
          details: {
            warmup: "5min easy jog",
            mainSet: "Easy recovery run",
            intervals: [
              { distance: "8-10km", pace: "Easy recovery pace", reps: 1 },
            ],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "Light stretching",
          },
        },
      },
    };

    // Get the training data for this week
    const weekData = realTrainingData[weekNumber];
    if (weekData) {
      dayKeys.forEach((dayKey) => {
        days[dayKey] = { ...weekData[dayKey] };
      });
    }

    return days;
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

  const generateWeekData = (weekStart) => {
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

    // Training templates that rotate
    const trainingTemplates = [
      {
        monday: {
          type: "Easy Run",
          distance: "8 km",
          duration: "35-40 min",
          pace: "4:30-5:00 /km",
          notes: "Recovery pace, focus on form",
          intensity: "low",
          location: "Park loop",
        },
        tuesday: {
          type: "Interval Training",
          distance: "10 km",
          duration: "45 min",
          pace: "3:20-3:40 /km",
          notes: "Complex pyramid interval session",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "2km easy jog + 6x100m strides",
            mainSet: "4x(600m + 400m + 300m + 200m)",
            intervals: [
              { distance: "600m", pace: "3:20 /km", reps: 4 },
              { distance: "400m", pace: "3:15 /km", reps: 4 },
              { distance: "300m", pace: "3:10 /km", reps: 4 },
              { distance: "200m", pace: "3:05 /km", reps: 4 },
            ],
            rest: {
              betweenReps: "2.5min between reps",
              betweenSets: "4min between sets",
            },
            cooldown: "2km easy jog + 15min stretching",
          },
        },
        wednesday: {
          type: "Easy Run",
          distance: "6 km",
          duration: "28-32 min",
          pace: "4:40-5:10 /km",
          notes: "Active recovery",
          intensity: "low",
          location: "Streets",
        },
        thursday: {
          type: "Tempo Run",
          distance: "12 km",
          duration: "50 min",
          pace: "3:50-4:10 /km",
          notes: "Progressive tempo run with build-up",
          intensity: "medium",
          location: "River path",
          details: {
            warmup: "3km easy pace + 4x100m accelerations",
            mainSet: "3x(2km tempo + 1km recovery)",
            intervals: [
              { distance: "2km", pace: "3:50-4:00 /km", reps: 3 },
              { distance: "1km", pace: "4:30-5:00 /km", reps: 3 },
            ],
            rest: {
              betweenReps: "1km easy recovery jog",
              betweenSets: null,
            },
            cooldown: "2km easy + dynamic stretching",
          },
        },
        friday: {
          type: "Rest Day",
          distance: "-",
          duration: "-",
          pace: "-",
          notes: "Complete rest or light stretching",
          intensity: "rest",
          location: "-",
        },
        saturday: {
          type: "Long Run",
          distance: "18 km",
          duration: "80-90 min",
          pace: "4:20-4:50 /km",
          notes: "Steady effort, practice race nutrition",
          intensity: "medium",
          location: "Long route",
        },
        sunday: {
          type: "Recovery Run",
          distance: "5 km",
          duration: "25 min",
          pace: "5:00-5:30 /km",
          notes: "Very easy pace, shake out legs",
          intensity: "low",
          location: "Park",
        },
      },
      {
        monday: {
          type: "Easy Run",
          distance: "9 km",
          duration: "38-42 min",
          pace: "4:20-4:50 /km",
          notes: "Comfortable effort",
          intensity: "low",
          location: "Park loop",
        },
        tuesday: {
          type: "Speed Work",
          distance: "8 km",
          duration: "40 min",
          pace: "3:10-3:30 /km",
          notes: "High intensity interval session",
          intensity: "high",
          location: "Track",
          details: {
            warmup: "15min easy jog + dynamic stretching",
            mainSet: "8x400m at mile pace",
            intervals: [{ distance: "400m", pace: "3:10-3:30 /km", reps: 8 }],
            rest: {
              betweenReps: "90 seconds walking recovery",
              betweenSets: null,
            },
            cooldown: "10min easy jog + stretching",
          },
        },
        wednesday: {
          type: "Easy Run",
          distance: "7 km",
          duration: "32-36 min",
          pace: "4:35-5:00 /km",
          notes: "Recovery run",
          intensity: "low",
          location: "Streets",
        },
        thursday: {
          type: "Threshold Run",
          distance: "10 km",
          duration: "42 min",
          pace: "3:45-4:00 /km",
          notes: "Sustained threshold effort",
          intensity: "medium",
          location: "River path",
          details: {
            warmup: "2km easy + 4x100m strides",
            mainSet: "6km threshold run",
            intervals: [{ distance: "6km", pace: "3:45-4:00 /km", reps: 1 }],
            rest: {
              betweenReps: null,
              betweenSets: null,
            },
            cooldown: "2km easy + stretching",
          },
        },
        friday: {
          type: "Rest Day",
          distance: "-",
          duration: "-",
          pace: "-",
          notes: "Complete rest",
          intensity: "rest",
          location: "-",
        },
        saturday: {
          type: "Long Run",
          distance: "20 km",
          duration: "85-95 min",
          pace: "4:15-4:45 /km",
          notes: "Progressive run, negative split",
          intensity: "medium",
          location: "Long route",
        },
        sunday: {
          type: "Recovery Run",
          distance: "6 km",
          duration: "28 min",
          pace: "4:50-5:20 /km",
          notes: "Easy shakeout",
          intensity: "low",
          location: "Park",
        },
      },
    ];

    // Get week number to determine which template to use
    const weekNumber = Math.floor(
      weekStart.getTime() / (7 * 24 * 60 * 60 * 1000)
    );
    const template = trainingTemplates[weekNumber % trainingTemplates.length];

    dayKeys.forEach((dayKey, index) => {
      days[dayKey] = { ...template[dayKey] };
    });

    return days;
  };

  const isToday = (monthIndex, weekIndex, dayKey) => {
    if (!trainingData[monthIndex]?.weeks[weekIndex]) return false;

    const weekData = trainingData[monthIndex].weeks[weekIndex];
    const weekStart = new Date(weekData.weekStart);
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
          cellDate.toDateString()
        );
      });
    }

    setTrainingData(realTimeData);

    // Fetch Strava data for empty cells
    fetchCellStravaData();

    setLoading(false);

    // Load completed workouts from localStorage
    const saved = localStorage.getItem("completedWorkouts");
    if (saved) {
      setCompletedWorkouts(JSON.parse(saved));
    }

    // Update today's date every minute
    const interval = setInterval(() => {
      setToday(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
    return "🏃";
  };

  const getWorkoutKey = (monthIndex, weekIndex, dayKey) => {
    return `${monthIndex}-${weekIndex}-${dayKey}`;
  };

  const isWorkoutCompleted = (monthIndex, weekIndex, dayKey) => {
    const key = getWorkoutKey(monthIndex, weekIndex, dayKey);
    return completedWorkouts[key] || false;
  };

  const toggleWorkoutCompletion = (monthIndex, weekIndex, dayKey) => {
    const key = getWorkoutKey(monthIndex, weekIndex, dayKey);
    const newCompletedWorkouts = {
      ...completedWorkouts,
      [key]: !completedWorkouts[key],
    };

    setCompletedWorkouts(newCompletedWorkouts);
    localStorage.setItem(
      "completedWorkouts",
      JSON.stringify(newCompletedWorkouts)
    );

    // Update selectedDay if it's currently open
    if (
      selectedDay &&
      selectedDay.month === monthIndex &&
      selectedDay.week === weekIndex + 1 &&
      selectedDay.day === dayKey
    ) {
      setSelectedDay({
        ...selectedDay,
        completed: newCompletedWorkouts[key],
      });
    }
  };

  const openDayDetails = (monthIndex, weekIndex, dayKey) => {
    const dayData = trainingData[monthIndex]?.weeks[weekIndex]?.days[dayKey];
    const weekData = trainingData[monthIndex]?.weeks[weekIndex];

    if (dayData && weekData) {
      const completed = isWorkoutCompleted(monthIndex, weekIndex, dayKey);

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
      const weekStartDate = new Date(weekData.weekStart + "T00:00:00");
      const cellDate = new Date(weekStartDate);
      cellDate.setDate(weekStartDate.getDate() + dayIndex);

      // Format the full date
      const fullDayName = cellDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const fullDate = cellDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      setSelectedDay({
        ...dayData,
        month: monthIndex,
        week: weekIndex + 1,
        day: dayKey,
        completed: completed,
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
      // Fetch recent activities (last 50)
      const response = await fetch("/api/strava?per_page=50");
      const activities = await response.json();

      if (Array.isArray(activities) && activities.length > 0) {
        // Filter out private activities first
        const publicActivities = activities.filter(
          (activity) => !activity.private
        );

        // Find all activities for the specific date using proper date comparison
        const targetDate = new Date(date);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        const targetDay = targetDate.getDate();

        const dayActivities = publicActivities.filter((activity) => {
          // Parse start_date_local properly to avoid timezone issues
          const activityDate = new Date(activity.start_date_local);
          const activityYear = activityDate.getFullYear();
          const activityMonth = activityDate.getMonth();
          const activityDay = activityDate.getDate();

          console.log(
            `Comparing: Target ${targetYear}-${
              targetMonth + 1
            }-${targetDay} vs Activity ${activityYear}-${
              activityMonth + 1
            }-${activityDay} (${activity.name})`
          );
          return (
            activityYear === targetYear &&
            activityMonth === targetMonth &&
            activityDay === targetDay
          );
        });

        console.log(
          `Found ${dayActivities.length} public activities for ${targetYear}-${
            targetMonth + 1
          }-${targetDay}`
        );
        setDayActivities(dayActivities);
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
      const response = await fetch("/api/strava?per_page=50");
      const activities = await response.json();

      if (Array.isArray(activities) && activities.length > 0) {
        const publicActivities = activities.filter(
          (activity) => !activity.private
        );
        const stravaDataMap = {};

        publicActivities.forEach((activity) => {
          const activityDate = new Date(activity.start_date_local);
          const dateKey = `${activityDate.getFullYear()}-${activityDate.getMonth()}-${activityDate.getDate()}`;

          // Store the first (most recent) activity for each date
          if (!stravaDataMap[dateKey]) {
            stravaDataMap[dateKey] = activity;
          }
        });

        setCellStravaData(stravaDataMap);
      }
    } catch (error) {
      console.error("Error fetching cell Strava data:", error);
    }
  };

  // Get Strava data for a specific date
  const getStravaDataForDate = (date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return cellStravaData[dateKey];
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
      {/* Header */}
      <div className={styles.header}>
        <Link href="/info" className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Info
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <Calendar size={28} />
            Training Schedule
          </h1>
          <p className={styles.subtitle}>
            Monthly running program and training plan
          </p>
        </div>
      </div>

      {/* Training Calendar Table - Monthly View */}
      {trainingData[currentMonth] && (
        <div className={styles.calendarContainer}>
          <div className={styles.weekHeader}>
            <div className={styles.monthNavigation}>
              <h2 className={styles.monthTitle}>
                {trainingData[currentMonth].monthName}
              </h2>
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
                    // Go to current month (July = 0)
                    setCurrentMonth(0);
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
              <div key={weekIndex} className={styles.trainingRow}>
                {/* Week Number Column */}
                <div className={styles.weekColumn}>
                  <div className={styles.weekNumber}>Week {weekData.week}</div>
                  <div className={styles.weekDateRange}>
                    {(() => {
                      const startDate = new Date(weekData.weekStart); // This is always Monday
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
                    const isCompleted = isWorkoutCompleted(
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
                    const weekStartDate = new Date(
                      weekData.weekStart + "T00:00:00"
                    ); // Add time to avoid timezone issues
                    const cellDate = new Date(weekStartDate);
                    cellDate.setDate(weekStartDate.getDate() + index);

                    const dayName = cellDate.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const dateNumber = cellDate.getDate();

                    // Debug log for first few cells
                    if (weekIndex === 0 && index < 3) {
                      console.log(
                        `Cell ${index} (${dayKey}): ${dayName} ${dateNumber}, expected day ${
                          index + 1
                        }, actual day ${cellDate.getDay()}`
                      );
                    }

                    return (
                      <div
                        key={dayKey}
                        className={`${styles.dayCell} ${
                          isCompleted ? styles.completed : ""
                        } ${isTodayCell ? styles.today : ""}`}
                        onClick={() =>
                          openDayDetails(currentMonth, weekIndex, dayKey)
                        }
                        style={{
                          borderLeft: `4px solid ${getIntensityColor(
                            dayData.intensity
                          )}`,
                        }}
                      >
                        {isTodayCell && (
                          <div className={styles.todayIndicator}></div>
                        )}
                        <div className={styles.cellDate}>
                          <span className={styles.dayName}>{dayName}</span>
                          <span className={styles.dateNumber}>
                            {dateNumber}
                          </span>
                        </div>
                        <div className={styles.dayContent}>
                          {(() => {
                            // Check if this is an empty cell and has Strava data
                            if (dayData.isEmpty) {
                              const stravaData = getStravaDataForDate(cellDate);
                              if (stravaData) {
                                // Show Strava data instead of empty content
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
                              // Empty cell with no Strava data - show nothing
                              return null;
                            }

                            // Regular training data display
                            return (
                              <>
                                <div className={styles.workoutType}>
                                  <span className={styles.workoutIcon}>
                                    {getIntensityIcon(dayData.type)}
                                  </span>
                                  {dayData.type}
                                  {isCompleted && (
                                    <span className={styles.completedBadge}>
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <div className={styles.workoutDetails}>
                                  <div className={styles.distance}>
                                    {dayData.distance}
                                  </div>
                                  <div className={styles.duration}>
                                    {dayData.duration}
                                  </div>
                                  {dayData.pace !== "-" && (
                                    <div className={styles.pace}>
                                      {dayData.pace}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
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

              <div className={styles.modalStats}>
                <div className={styles.modalStat}>
                  <Target size={18} />
                  <span>Distance: {selectedDay.distance}</span>
                </div>
                <div className={styles.modalStat}>
                  <Clock size={18} />
                  <span>Duration: {selectedDay.duration}</span>
                </div>
                <div className={styles.modalStat}>
                  <Activity size={18} />
                  <span>Pace: {selectedDay.pace}</span>
                </div>
                <div className={styles.modalStat}>
                  <MapPin size={18} />
                  <span>Location: {selectedDay.location}</span>
                </div>
              </div>

              {/* Detailed Training Instructions */}
              {selectedDay.details && (
                <div className={styles.modalDetails}>
                  <h4>Training Details:</h4>

                  <div className={styles.trainingSection}>
                    <div className={styles.sectionTitle}>
                      <span className={styles.sectionIcon}>🏃‍♂️</span>
                      Warm-up:
                    </div>
                    <p className={styles.sectionContent}>
                      {selectedDay.details.warmup}
                    </p>
                  </div>

                  <div className={styles.trainingSection}>
                    <div className={styles.sectionTitle}>
                      <span className={styles.sectionIcon}>🎯</span>
                      Main Set:
                    </div>
                    <p className={styles.sectionContent}>
                      {selectedDay.details.mainSet}
                    </p>

                    {selectedDay.details.intervals &&
                      selectedDay.details.intervals.length > 0 && (
                        <div className={styles.intervalDetails}>
                          {selectedDay.details.intervals.map(
                            (interval, index) => (
                              <div key={index} className={styles.intervalItem}>
                                <span className={styles.intervalDistance}>
                                  {interval.distance}
                                </span>
                                <span className={styles.intervalPace}>
                                  @ {interval.pace}
                                </span>
                                <span className={styles.intervalReps}>
                                  x{interval.reps}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>

                  {(selectedDay.details.rest.betweenReps ||
                    selectedDay.details.rest.betweenSets) && (
                    <div className={styles.trainingSection}>
                      <div className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>⏱️</span>
                        Rest Periods:
                      </div>
                      <div className={styles.restDetails}>
                        {selectedDay.details.rest.betweenReps && (
                          <p className={styles.restItem}>
                            <strong>Between reps:</strong>{" "}
                            {selectedDay.details.rest.betweenReps}
                          </p>
                        )}
                        {selectedDay.details.rest.betweenSets && (
                          <p className={styles.restItem}>
                            <strong>Between sets:</strong>{" "}
                            {selectedDay.details.rest.betweenSets}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.trainingSection}>
                    <div className={styles.sectionTitle}>
                      <span className={styles.sectionIcon}>🧘‍♂️</span>
                      Cool-down:
                    </div>
                    <p className={styles.sectionContent}>
                      {selectedDay.details.cooldown}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.modalNotes}>
                <h4>Training Notes:</h4>
                <p>{selectedDay.notes}</p>
              </div>

              <div className={styles.modalActions}>
                <div
                  className={styles.intensityBadge}
                  style={{
                    backgroundColor: getIntensityColor(selectedDay.intensity),
                    color: "white",
                  }}
                >
                  {selectedDay.intensity.toUpperCase()} INTENSITY
                </div>

                <button
                  className={`${styles.completedButton} ${
                    selectedDay.completed ? styles.completed : ""
                  }`}
                  onClick={() =>
                    toggleWorkoutCompletion(
                      selectedDay.monthIndex,
                      selectedDay.weekIndex,
                      selectedDay.day
                    )
                  }
                >
                  {selectedDay.completed ? "✓ Completed" : "Mark as Done"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
