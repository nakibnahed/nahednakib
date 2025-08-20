"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import styles from "./PublicAnalytics.module.css";
import {
  BarChart3,
  Users,
  Eye,
  Heart,
  MessageSquare,
  BookOpen,
  Briefcase,
  Mail,
  TrendingUp,
  Activity,
  Calendar,
  ArrowUpRight,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function PublicAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null); // Track which segment is selected

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching analytics data...");
        const response = await fetch(`/api/analytics/public`);

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Response error text:", errorText);
          throw new Error(
            `Failed to fetch analytics: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Analytics data received:", data);
        setAnalytics(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Failed to load analytics data: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.totals) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Page Views",
      value: analytics.totals.views,
      change: null,
      changeLabel: "all-time views",
      icon: <Eye size={24} />,
      color: "#ee681a",
    },
    {
      title: "Total Users",
      value: analytics.totals.users,
      change: null,
      changeLabel: "registered users",
      icon: <Users size={24} />,
      color: "#ee681a",
    },
    {
      title: "Total Comments",
      value: analytics.totals.comments,
      change: null,
      changeLabel: "all comments",
      icon: <MessageSquare size={24} />,
      color: "#ee681a",
    },
    {
      title: "Total Likes",
      value: analytics.totals.likes,
      change: null,
      changeLabel: "all likes everywhere",
      icon: <Heart size={24} />,
      color: "#ee681a",
    },
    {
      title: "Blog Articles",
      value: analytics.totals.blogs,
      change: null,
      changeLabel: "total published posts",
      icon: <BookOpen size={24} />,
      color: "#ee681a",
    },
    {
      title: "Portfolio Projects",
      value: analytics.totals.portfolios,
      change: null,
      changeLabel: "total projects",
      icon: <Briefcase size={24} />,
      color: "#ee681a",
    },
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1a1a1a",
        titleColor: "#ffffff",
        bodyColor: "#aaaaaa",
        borderColor: "#ee681a",
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: window.innerWidth < 768 ? 12 : 14,
          weight: "600",
          family: "Montserrat",
        },
        bodyFont: {
          size: window.innerWidth < 768 ? 11 : 13,
          family: "Montserrat",
        },
        padding: window.innerWidth < 768 ? 8 : 12,
        callbacks: {
          title: function (context) {
            return `${context[0].label} 2024`;
          },
          label: function (context) {
            return `Views: ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#aaaaaa",
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            family: "Montserrat",
          },
          maxRotation: window.innerWidth < 768 ? 45 : 0,
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: "#232329",
          drawBorder: false,
        },
        ticks: {
          color: "#aaaaaa",
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            family: "Montserrat",
          },
          callback: function (value) {
            return value.toLocaleString();
          },
        },
        border: { display: false },
      },
    },
    elements: {
      point: {
        radius: window.innerWidth < 768 ? 4 : 6,
        hoverRadius: window.innerWidth < 768 ? 8 : 10,
        backgroundColor: "#ee681a",
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverBackgroundColor: "#ee681a",
        hoverBorderColor: "#ffffff",
        hoverBorderWidth: 3,
      },
      line: {
        tension: 0.4,
        borderCapStyle: "round",
        borderJoinStyle: "round",
      },
    },
    onHover: (event, activeElements) => {
      event.native.target.style.cursor =
        activeElements.length > 0 ? "pointer" : "default";
    },
  };

  // Simple chart data showing growth over time
  const chartLabels = ["Q1", "Q2", "Q3", "Q4"];
  const chartData = [
    Math.floor(analytics.totals.views * 0.15),
    Math.floor(analytics.totals.views * 0.35),
    Math.floor(analytics.totals.views * 0.65),
    analytics.totals.views,
  ];

  const engagementData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Total Page Views Growth",
        data: chartData,
        borderColor: "#ee681a",
        backgroundColor: "rgba(238, 104, 26, 0.1)",
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: "#ee681a",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 10,
        pointHoverBackgroundColor: "#ee681a",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const contentData = {
    labels: ["Blog Posts", "Portfolio Projects", "Page Views", "Users"],
    datasets: [
      {
        data: [
          analytics.totals.blogs,
          analytics.totals.portfolios,
          Math.floor(analytics.totals.views / 10), // Scale down views to show proportionally
          analytics.totals.users,
        ],
        backgroundColor: ["#ee681a", "#f59e0b", "#d97706", "#b45309"],
        borderWidth: 2,
        borderColor: "#1a1a1a",
        cutout: "60%",
        hoverOffset: 8,
      },
    ],
  };

  // Find the segment with the biggest value
  const total = contentData.datasets[0].data.reduce((a, b) => a + b, 0);
  const maxValue = Math.max(...contentData.datasets[0].data);
  const biggestSegmentIndex = contentData.datasets[0].data.indexOf(maxValue);

  // Use selected segment if clicked, otherwise use the biggest segment
  const activeSegmentIndex =
    selectedSegment !== null ? selectedSegment : biggestSegmentIndex;
  const activeValue = contentData.datasets[0].data[activeSegmentIndex];
  const activePercentage = Math.round((activeValue / total) * 100);

  // Plugin to draw text in center
  const centerTextPlugin = {
    id: "centerText",
    afterDraw: (chart) => {
      const { width, height, ctx } = chart;
      const { chartArea } = chart;
      if (!chartArea) return;

      ctx.save();
      const fontSize = Math.min(width, height) / 10;
      ctx.font = `700 ${fontSize}px Montserrat`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#888888"; // Using --text-dark color

      const centerX = chartArea.left + (chartArea.right - chartArea.left) / 2;
      const centerY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;

      // Get current data for the active segment (biggest or selected)
      const currentTotal = chart.data.datasets[0].data.reduce(
        (a, b) => a + b,
        0
      );
      const currentMaxValue = Math.max(...chart.data.datasets[0].data);
      const currentBiggestIndex =
        chart.data.datasets[0].data.indexOf(currentMaxValue);
      const currentActiveIndex =
        selectedSegment !== null ? selectedSegment : currentBiggestIndex;
      const currentValue = chart.data.datasets[0].data[currentActiveIndex] || 0;
      const currentPercentage =
        currentTotal > 0 ? Math.round((currentValue / currentTotal) * 100) : 0;

      ctx.fillText(`${currentPercentage}%`, centerX, centerY);
      ctx.restore();
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const clickedIndex = elements[0].index;
        console.log("Chart clicked, segment:", clickedIndex);
        setSelectedSegment(clickedIndex);
      }
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: window.innerWidth < 768 ? 12 : 16,
          usePointStyle: true,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            family: "Montserrat",
          },
          color: "#aaaaaa",
          boxWidth: window.innerWidth < 768 ? 10 : 12,
          boxHeight: window.innerWidth < 768 ? 10 : 12,
        },
        onClick: (event, legendItem) => {
          console.log("Legend clicked, segment:", legendItem.index);
          setSelectedSegment(legendItem.index);
        },
      },
      tooltip: {
        backgroundColor: "#1a1a1a",
        titleColor: "#ffffff",
        bodyColor: "#aaaaaa",
        borderColor: "#ee681a",
        borderWidth: 1,
        cornerRadius: 12,
        padding: window.innerWidth < 768 ? 8 : 12,
        titleFont: {
          size: window.innerWidth < 768 ? 11 : 13,
          family: "Montserrat",
        },
        bodyFont: {
          size: window.innerWidth < 768 ? 10 : 12,
          family: "Montserrat",
        },
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            if (label === "Page Views") {
              return `${label}: ${value * 10} (${percentage}%)`;
            }
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: "#1a1a1a",
      },
    },
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Site Analytics</h1>
            <p className={styles.pageSubtitle}>
              Real-time insights into website performance and user engagement
            </p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.lastUpdated}>
              <Calendar size={16} />
              <span>
                Updated{" "}
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={index}
            className={styles.kpiCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon} style={{ color: kpi.color }}>
                {kpi.icon}
              </div>
              <div className={styles.kpiTrend}>
                {kpi.change !== null && kpi.change > 0 && (
                  <>
                    <ArrowUpRight size={16} className={styles.trendIcon} />
                    <span className={styles.trendValue}>+{kpi.change}</span>
                  </>
                )}
              </div>
            </div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiValue}>{formatNumber(kpi.value)}</h3>
              <p className={styles.kpiTitle}>{kpi.title}</p>
              <span className={styles.kpiChange}>{kpi.changeLabel}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Traffic Overview</h3>
              <p className={styles.chartSubtitle}>Total page views growth</p>
            </div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <div
                  className={styles.legendDot}
                  style={{ backgroundColor: "#ee681a" }}
                ></div>
                <span>Views</span>
              </div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <Line data={engagementData} options={chartOptions} />
          </div>
        </motion.div>

        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Content Distribution</h3>
              <p className={styles.chartSubtitle}>Breakdown by content type</p>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <Doughnut
              key={`${selectedSegment}-${biggestSegmentIndex}`} // Force re-render when segment changes
              data={contentData}
              options={doughnutOptions}
              plugins={[centerTextPlugin]}
            />
          </div>
        </motion.div>
      </div>

      {/* Detailed Stats */}
      <motion.div
        className={styles.detailedStats}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className={styles.sectionTitle}>Detailed Metrics</h3>
        <div className={styles.statsTable}>
          <div className={styles.statRow}>
            <div className={styles.statLabel}>
              <BookOpen size={20} />
              <span>Blog Articles</span>
            </div>
            <div className={styles.statValue}>{analytics.totals.blogs}</div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statLabel}>
              <Briefcase size={20} />
              <span>Portfolio Projects</span>
            </div>
            <div className={styles.statValue}>
              {analytics.totals.portfolios}
            </div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statLabel}>
              <MessageSquare size={20} />
              <span>User Comments</span>
            </div>
            <div className={styles.statValue}>{analytics.totals.comments}</div>
          </div>
          <div className={styles.statRow}>
            <div className={styles.statLabel}>
              <Mail size={20} />
              <span>Newsletter Subscribers</span>
            </div>
            <div className={styles.statValue}>
              {analytics.totals.newsletterSubscribers}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
