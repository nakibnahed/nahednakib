"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiMoon,
  FiSun,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiArrowRight,
  FiArrowLeft,
  FiXCircle,
  FiMessageSquare,
  FiUsers,
  FiMail,
} from "react-icons/fi";
import { MessageCircle } from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import DateTimePicker from "./DateTimePicker";
import { supabase } from "@/services/supabaseClient";
import { normalizeSuggestedTimeDisplay } from "@/utils/practiceSuggestedTime";
import { withTimeout } from "@/utils/withTimeout";
import styles from "./page.module.css";

const AVATAR_COLORS = [
  styles.avBlue,
  styles.avPurple,
  styles.avGreen,
  styles.avCoral,
  styles.avPink,
  styles.avTeal,
];

const TIME_SLOTS = [
  { value: "morning", label: "Morning" },
  { value: "noon", label: "Noon" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

const FILTER_CHIPS = [
  { val: "all", label: "All" },
  { val: "morning", label: "Morning" },
  { val: "noon", label: "Noon & Afternoon" },
  { val: "evening", label: "Evening" },
];

const REQUEST_FILTERS = [
  { val: "all", label: "All" },
  { val: "pending", label: "Pending" },
  { val: "accepted", label: "Approved" },
  { val: "cancelled", label: "Cancelled" },
];

function slotLabel(value) {
  const found = TIME_SLOTS.find((s) => s.value === value);
  return found ? found.label : value;
}

function getSlotFromHour(hour) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 14) return "noon";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "evening";
  return "night";
}

function initials(name) {
  const t = (name || "").trim();
  return t.slice(0, 2) || "?";
}

function avatarClassForName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatAvailability(from) {
  if (!from) return null;
  const dateFrom = new Date(from);
  const date = dateFrom.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFrom = dateFrom.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}, ${timeFrom}`;
}

function splitTimeDisplay(display) {
  if (!display) return null;
  const [date, time] = display.split(", ");
  if (!date || !time) return null;
  return { date, time };
}

function formatAvailabilityParts(from) {
  if (!from) return null;
  const dateFrom = new Date(from);
  return {
    date: dateFrom.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: dateFrom.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

function isStillAvailable(student, now = new Date()) {
  if (!student || student.status !== "available") return false;
  if (!student.available_until) return true;
  return new Date(student.available_until) > now;
}

function matchesFilter(student, filter) {
  const slots = student.slots || [];
  if (filter === "all") return true;
  if (filter === "available") return student.status === "available";
  if (filter === "morning") return slots.includes("morning");
  if (filter === "noon")
    return slots.includes("noon") || slots.includes("afternoon");
  if (filter === "evening") return slots.includes("evening");
  if (filter === "night") return slots.includes("night");
  return true;
}

function requestStatusLabel(status) {
  if (status === "accepted") return "Approved";
  if (status === "cancelled") return "Cancelled";
  if (status === "declined") return "Declined";
  return "Pending";
}

export default function ConversationPracticePage() {
  const router = useRouter();
  const [tab, setTab] = useState("browse");
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState("all");
  const [filter, setFilter] = useState("all");
  const [bootState, setBootState] = useState("booting");
  const [dbError, setDbError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [regName, setRegName] = useState("");
  const today = new Date();
  const [regDate, setRegDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const [modalTarget, setModalTarget] = useState(null);
  const [reqMsg, setReqMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [cancelModalRequest, setCancelModalRequest] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [authPrompt, setAuthPrompt] = useState(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState(null);
  const studentsFetchSeqRef = useRef(0);
  const requestsFetchSeqRef = useRef(0);
  const bootSeqRef = useRef(0);

  const showToast = useCallback((msg, type) => {
    const resolved =
      type ||
      (/^(please|could not|failed|save your|this target)/i.test(msg)
        ? "error"
        : "success");
    if (typeof window !== "undefined" && window.showToast) {
      window.showToast(msg, resolved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "requests") {
      setTab("requests");
    }
  }, []);

  const activeName = currentUserName;
  const activeEmail = currentUserEmail;

  const redirectToLogin = useCallback(() => {
    if (typeof window === "undefined") {
      router.push("/login");
      return;
    }
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    router.push(`/login?next=${encodeURIComponent(returnTo)}`);
  }, [router]);

  const requireAuth = useCallback(
    (context = "action") => {
      if (currentUser?.id) return true;
      setAuthPrompt(context);
      showToast("Please login to continue.", "error");
      redirectToLogin();
      return false;
    },
    [currentUser?.id, redirectToLogin, showToast],
  );

  const loadCurrentUser = useCallback(async () => {
    const {
      data: { session },
    } = await withTimeout(
      supabase.auth.getSession(),
      9000,
      "Authentication check timed out. Please refresh.",
    );

    const user = session?.user || null;
    setCurrentUser(user);
    if (!user) {
      setCurrentUserName("");
      setCurrentUserEmail("");
      setProfileAvatarUrl("");
      setRegName("");
      setIsAdmin(false);
      return null;
    }

    setCurrentUserEmail(user.email || "");
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, first_name, last_name, email, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const metaAvatar =
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url.trim()
        : typeof user.user_metadata?.picture === "string"
          ? user.user_metadata.picture.trim()
          : "";

    setProfileAvatarUrl(profile?.avatar_url?.trim() || metaAvatar || "");

    const displayName =
      profile?.full_name ||
      (profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : null) ||
      profile?.email ||
      user.email ||
      "Student";

    setCurrentUserName(displayName);
    setRegName(displayName);
    setIsAdmin(profile?.role === "admin");
    return user;
  }, []);

  const fetchStudents = useCallback(async () => {
    const seq = ++studentsFetchSeqRef.current;
    const { data, error } = await supabase
      .from("practice_students")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setDbError(error.message);
      return;
    }

    setDbError(null);
    const now = new Date();
    const active = (data || []).filter((s) => isStillAvailable(s, now));
    if (seq !== studentsFetchSeqRef.current) return;
    setStudents(active);
  }, []);

  const fetchRequests = useCallback(async ({ userId }) => {
    const seq = ++requestsFetchSeqRef.current;
    if (!userId) {
      setRequests([]);
      return;
    }

    const { data, error } = await supabase
      .from("practice_requests")
      .select("*")
      .or(`to_user_id.eq.${userId},from_user_id.eq.${userId}`)
      .in("status", ["pending", "accepted", "cancelled", "declined"])
      .order("created_at", { ascending: false });

    if (error) {
      setDbError(error.message);
      return;
    }

    setDbError(null);
    if (seq !== requestsFetchSeqRef.current) return;
    setRequests(data || []);
  }, []);

  useEffect(() => {
    let closed = false;
    const bootSeq = ++bootSeqRef.current;

    (async () => {
      try {
        setBootState("booting");
        const [user] = await Promise.all([
          loadCurrentUser(),
          fetchStudents(),
        ]);
        if (user?.id) {
          await fetchRequests({ userId: user.id });
        } else {
          setRequests([]);
        }
        if (!closed && bootSeq === bootSeqRef.current) {
          setBootState("ready");
        }
      } catch (error) {
        if (!closed && bootSeq === bootSeqRef.current) {
          setDbError(error?.message || "Could not load this page.");
          setBootState("error");
        }
      }
    })();

    return () => {
      closed = true;
    };
  }, [fetchRequests, fetchStudents, loadCurrentUser]);

  useEffect(() => {
    const chStudents = supabase
      .channel("practice_students_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "practice_students" },
        () => fetchStudents(),
      )
      .subscribe();

    const chRequests = supabase
      .channel("practice_requests_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "practice_requests" },
        () => {
          if (currentUser?.id) {
            fetchRequests({
              userId: currentUser?.id,
            });
          }
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchStudents();
      if (currentUser?.id) {
        fetchRequests({
          userId: currentUser?.id,
        });
      }
    }, 30_000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(chStudents);
      supabase.removeChannel(chRequests);
    };
  }, [currentUser?.id, fetchRequests, fetchStudents]);

  async function handleRegister(e) {
    e.preventDefault();
    if (!requireAuth("availability")) return;
    const name = regName.trim();
    if (!name) {
      showToast("Please enter your name first");
      return;
    }

    if (!regDate) {
      showToast("Please select a date and time.");
      return;
    }
    const fromDate = regDate;
    const untilDate = new Date(regDate.getTime() + 60 * 60 * 1000); // +1 hour
    const autoSlots = [getSlotFromHour(fromDate.getHours())];

    setSaving(true);
    const { error } = await supabase.from("practice_students").upsert(
      {
        user_id: currentUser.id,
        name,
        email: currentUserEmail,
        status: "available",
        slots: autoSlots,
        available_from: fromDate.toISOString(),
        available_until: untilDate.toISOString(),
      },
      { onConflict: "user_id" },
    );

    setSaving(false);
    if (error) {
      setDbError(error.message);
      showToast("Could not save. Run the latest SQL migration.");
      return;
    }

    showToast("Availability saved.");
    await fetchStudents();
    setTab("browse");
  }

  async function handleSendRequest(e) {
    e.preventDefault();
    if (!requireAuth("request")) return;
    if (!modalTarget) return;
    if (!modalTarget.user_id) {
      showToast("This target does not have a valid identity yet.");
      return;
    }
    if (modalTarget.user_id === currentUser?.id) {
      showToast("You cannot send a request to yourself.");
      return;
    }

    setSending(true);
    const { data: insertedRows, error } = await supabase
      .from("practice_requests")
      .insert({
        from_user_id: currentUser.id,
        from_name: activeName || regName || "Student",
        from_email: activeEmail || null,
        to_user_id: modalTarget.user_id,
        to_student_id: modalTarget.id,
        to_name: modalTarget.name,
        to_email: modalTarget.email,
        suggested_time: formatAvailability(modalTarget.available_from) || "",
        message: reqMsg.trim(),
      })
      .select("id")
      .limit(1);
    setSending(false);

    if (error) {
      setDbError(error.message);
      showToast("Could not send request");
      return;
    }

    showToast(`Request sent to ${modalTarget.name}`);
    setModalTarget(null);
    setReqMsg("");

    const requestId = insertedRows?.[0]?.id;
    if (requestId) {
      fetch("/api/practice/request-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      }).catch(() => {});
    }
    await fetchRequests({
      userId: currentUser.id,
    });
  }

  async function acceptRequest(request) {
    const res = await fetch("/api/practice/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    });

    const payload = await res.json();
    if (!res.ok) {
      showToast(payload?.error || "Failed to accept request");
      return;
    }

    showToast("Accepted. Email sent with Google Meet link.");
    await Promise.all([
      fetchStudents(),
      fetchRequests({
        userId: currentUser?.id,
      }),
    ]);
  }

  async function declineRequest(id) {
    const { error } = await supabase
      .from("practice_requests")
      .update({ status: "declined" })
      .eq("id", id)
      .eq("to_user_id", currentUser?.id);

    if (error) {
      showToast("Could not update request");
      return;
    }

    showToast("Request declined");
    await fetchRequests({
      userId: currentUser?.id,
    });
  }

  async function cancelApprovedRequest(request, reason = "") {
    setCancellingRequestId(request.id);
    const res = await fetch("/api/practice/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        reason,
      }),
    });
    const payload = await res.json();
    setCancellingRequestId(null);

    if (!res.ok) {
      showToast(payload?.error || "Could not cancel this meeting");
      return;
    }

    showToast("Meeting cancelled. The other participant was notified.");
    await fetchRequests({
      userId: currentUser?.id,
    });
  }

  async function submitCancelMeeting(e) {
    e.preventDefault();
    if (!cancelModalRequest) return;
    await cancelApprovedRequest(cancelModalRequest, cancelReason);
    setCancelModalRequest(null);
    setCancelReason("");
  }

  function deleteAvailabilitySession(student) {
    if (!isAdmin) return;
    setDeleteConfirmStudent(student);
  }

  async function confirmDeleteSession() {
    const student = deleteConfirmStudent;
    if (!student) return;

    const { error } = await supabase
      .from("practice_students")
      .delete()
      .eq("id", student.id);

    if (error) {
      showToast("Could not delete this session", "error");
      return;
    }

    await supabase
      .from("practice_requests")
      .delete()
      .eq("status", "pending")
      .eq("to_student_id", student.id);

    showToast("Availability session deleted");
    await fetchStudents();
    if (currentUser?.id) {
      await fetchRequests({ userId: currentUser?.id });
    }
  }

  const filtered = useMemo(() => {
    const now = Date.now();
    return students
      .filter((s) => matchesFilter(s, filter))
      .sort((a, b) => {
        const aTime = a.available_from ? new Date(a.available_from).getTime() : Infinity;
        const bTime = b.available_from ? new Date(b.available_from).getTime() : Infinity;
        const aPast = aTime < now;
        const bPast = bTime < now;
        if (aPast !== bPast) return aPast ? 1 : -1;
        return aTime - bTime;
      });
  }, [students, filter]);
  const availableCount = students.length;
  const pendingCount = requests.filter((r) => {
    const isIncoming = currentUser?.id && r.to_user_id === currentUser.id;
    return isIncoming && r.status === "pending";
  }).length;

  const visibleRequests = requests.filter((r) =>
    requestFilter === "all" ? true : r.status === requestFilter,
  );

  if (bootState === "booting") {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} dir="ltr" lang="en">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIcon}>
              <MessageCircle size={22} strokeWidth={1.8} />
            </div>
            <h1 className={styles.headerTitle}>Conversation Practice</h1>
          </div>
          <div className={styles.stats}>
            <div className={styles.statChip}>
              <span className={styles.liveDot} />
              <FiUsers size={13} />
              <span className={styles.statChipNum}>{students.length}</span>
              <span className={styles.statChipLabel}>available</span>
            </div>
            <div className={styles.statChip}>
              <FiMail size={13} />
              <span className={styles.statChipNum}>{pendingCount}</span>
              <span className={styles.statChipLabel}>pending requests</span>
            </div>
          </div>
        </div>
      </header>

      {!currentUser && (
        <div className={styles.setupHint}>
          Browse is open. Login is required to set availability or send requests.
        </div>
      )}
      {authPrompt && !currentUser && (
        <div className={`${styles.setupHint} ${styles.setupHintWarn}`}>
          Login required for {authPrompt}.
        </div>
      )}

      {dbError && (
        <div className={styles.setupHint} role="alert">
          Could not connect to required practice tables. Run the SQL migration
          then refresh. Details: {dbError}
        </div>
      )}

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          className={`${styles.tab} ${tab === "browse" ? styles.tabActive : ""}`}
          onClick={() => setTab("browse")}
        >
          Browse available
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === "register" ? styles.tabActive : ""}`}
          onClick={() => setTab("register")}
        >
          Set availability
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === "requests" ? styles.tabActive : ""}`}
          onClick={() => setTab("requests")}
        >
          {pendingCount > 0 && (
            <span className={styles.tabBadge}>{pendingCount}</span>
          )}
          Requests
        </button>
      </div>

      <div
        className={`${styles.section} ${tab === "browse" ? styles.sectionActive : ""}`}
      >
        <div className={styles.filters}>
          {FILTER_CHIPS.map((c) => (
            <button
              key={c.val}
              type="button"
              className={`${styles.chip} ${filter === c.val ? styles.chipOn : ""}`}
              onClick={() => setFilter(c.val)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={styles.studentsGrid}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><FiUsers size={32} /></div>
              <div className={styles.emptyText}>
                No students currently available.
              </div>
            </div>
          ) : (
            filtered.map((s) => {
              const isPast = s.available_from && new Date(s.available_from).getTime() < Date.now();
              return (
              <div
                key={s.id}
                className={`${styles.studentCard} ${styles.studentCardAvailable} ${isPast ? styles.studentCardPast : ""}`}
              >
                <div className={styles.cardTop}>
                  <div
                    className={`${styles.avatar} ${avatarClassForName(s.name || "")} ${
                      currentUser?.id === s.user_id && profileAvatarUrl
                        ? styles.avatarWithPhoto
                        : ""
                    }`}
                  >
                    {currentUser?.id === s.user_id && profileAvatarUrl ? (
                      <img
                        src={profileAvatarUrl}
                        alt=""
                        className={styles.avatarPhoto}
                      />
                    ) : (
                      initials(s.name)
                    )}
                  </div>
                  <div>
                    <div className={styles.cardName}>{s.name}</div>
                    <div
                      className={`${styles.cardStatus} ${styles.statusAvailable}`}
                    >
                      ● Available
                    </div>
                  </div>
                </div>
                <div className={styles.cardPillsRow}>
                  {(s.slots || []).map((sl) => {
                    const isNight = sl === "night" || sl === "evening";
                    return (
                      <span key={sl} className={styles.slotPill}>
                        {isNight ? <FiMoon size={12} /> : <FiSun size={12} />}
                        {slotLabel(sl)}
                      </span>
                    );
                  })}
                  {formatAvailabilityParts(s.available_from) &&
                    (() => {
                      const parts = formatAvailabilityParts(s.available_from);
                      return (
                        <>
                          <div className={styles.cardTime}>
                            <FiClock size={13} />
                            {parts.time}
                          </div>
                          <div className={styles.cardTime}>
                            <FiCalendar size={13} />
                            {parts.date}
                          </div>
                          {isPast && (
                            <div className={styles.cardTimePast}>
                              <FiAlertCircle size={12} />
                              Time passed
                            </div>
                          )}
                        </>
                      );
                    })()}
                </div>
                <div className={styles.cardFooter}>
                  {(() => {
                    const isOwnCard =
                      currentUser?.id && currentUser.id === s.user_id;
                    return isOwnCard ? (
                      <span className={styles.btnBusy}>
                        Your availability card
                      </span>
                    ) : isPast ? (
                      <span className={styles.btnBusy}>
                        Time passed
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnRequest}
                        onClick={() => {
                          if (!requireAuth("request")) return;
                          setModalTarget(s);
                        }}
                      >
                        Request meeting{" "}
                        <span className={styles.btnArrow}>→</span>
                      </button>
                    );
                  })()}
                  {isAdmin && (
                    <button
                      type="button"
                      className={styles.btnAdminDelete}
                      onClick={() => deleteAvailabilitySession(s)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`${styles.section} ${tab === "register" ? styles.sectionActive : ""}`}
      >
        <form
          id="practice-register-form"
          className={styles.formCard}
          onSubmit={handleRegister}
        >
          {currentUser && (
            <div
              className={styles.pageAvatar}
              aria-label={activeName || "Your profile"}
            >
              {profileAvatarUrl ? (
                <img
                  src={profileAvatarUrl}
                  alt=""
                  className={styles.pageAvatarImg}
                />
              ) : (
                <div
                  className={`${styles.avatar} ${styles.pageAvatarFallback} ${avatarClassForName(activeName || regName || "Student")}`}
                >
                  {initials(activeName || regName)}
                </div>
              )}
            </div>
          )}
          <h2 className={styles.formTitle}>Set your availability</h2>
          {!currentUser && (
            <div className={`${styles.setupHint} ${styles.setupHintWarn}`}>
              Please login first to set availability.
            </div>
          )}
          <div className={styles.field}>
            <label>Your name</label>
            <input
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              disabled={!currentUser}
              aria-readonly={!currentUser}
            />
          </div>
          {!currentUser && (
            <div className={styles.field}>
              <button
                type="button"
                className={styles.btnSubmit}
                onClick={redirectToLogin}
              >
                Login to continue
              </button>
            </div>
          )}
          <div className={styles.field}>
            <label>Date &amp; time</label>
            <DateTimePicker
              value={regDate}
              onChange={(date) => date && setRegDate(date)}
              minDate={new Date()}
              placeholder="Select date & time"
            />
          </div>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={saving || !currentUser}
          >
            {saving ? "Saving..." : "Save my availability"}
          </button>
        </form>
      </div>

      <div
        id="incoming-requests"
        className={`${styles.section} ${tab === "requests" ? styles.sectionActive : ""}`}
      >
        <div className={styles.filters}>
          {REQUEST_FILTERS.map((c) => (
            <button
              key={c.val}
              type="button"
              className={`${styles.chip} ${requestFilter === c.val ? styles.chipOn : ""}`}
              onClick={() => setRequestFilter(c.val)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {visibleRequests.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><FiMail size={32} /></div>
            <div className={styles.emptyText}>No requests in this status</div>
          </div>
        ) : (
          <div className={styles.reqList}>
            {visibleRequests.map((r, i) => {
              const isIncoming =
                currentUser?.id && r.to_user_id === currentUser.id;
              const isOutgoing =
                currentUser?.id && r.from_user_id === currentUser.id;
              const canAccept = r.status === "pending" && isIncoming;
              const canCancel =
                r.status === "accepted" && (isIncoming || isOutgoing);
              const timeDisplay = normalizeSuggestedTimeDisplay(
                r.suggested_time,
              );

              return (
                <div key={r.id} className={styles.reqCard}>
                  <div
                    className={`${styles.reqAvatar} ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                  >
                    {initials(isIncoming ? r.from_name : r.to_name)}
                  </div>
                  <div className={styles.reqInfo}>
                    <div className={styles.reqNameRow}>
                      <span className={styles.reqName}>
                        {isIncoming ? r.from_name : r.to_name}
                      </span>
                      <span className={styles.reqDirectionPill}>
                        {isIncoming ? (
                          <>
                            <FiArrowRight size={11} />
                            Incoming
                          </>
                        ) : (
                          <>
                            <FiArrowLeft size={11} />
                            Outgoing
                          </>
                        )}
                      </span>
                    </div>
                    <div className={styles.reqPillsRow}>
                      {/* status */}
                      <span
                        className={`${styles.reqStatus} ${
                          r.status === "accepted"
                            ? styles.reqStatusApproved
                            : r.status === "cancelled"
                              ? styles.reqStatusCancelled
                              : r.status === "declined"
                                ? styles.reqStatusDeclined
                                : styles.reqStatusPending
                        }`}
                      >
                        {requestStatusLabel(r.status)}
                      </span>
                      {/* time + date split */}
                      {splitTimeDisplay(timeDisplay) ? (
                        <>
                          <span className={styles.cardTime}>
                            <FiClock size={12} />
                            {splitTimeDisplay(timeDisplay).time}
                          </span>
                          <span className={styles.cardTime}>
                            <FiCalendar size={12} />
                            {splitTimeDisplay(timeDisplay).date}
                          </span>
                        </>
                      ) : timeDisplay ? (
                        <span className={styles.cardTime}>
                          <FiClock size={12} />
                          {timeDisplay}
                        </span>
                      ) : null}
                      {/* cancelled by */}
                      {r.status === "cancelled" && r.cancelled_by_name && (
                        <span className={styles.cardTime}>
                          <FiXCircle size={12} />
                          {r.cancelled_by_name}
                        </span>
                      )}
                    </div>
                    {/* message / reason */}
                    {r.status === "cancelled" && r.cancellation_reason && (
                      <div className={styles.reqMessage}>
                        <FiMessageSquare size={11} />
                        {r.cancellation_reason}
                      </div>
                    )}
                    {r.status !== "cancelled" && r.status !== "declined" && r.message && (
                      <div className={styles.reqMessage}>
                        <FiMessageSquare size={11} />
                        {r.message}
                      </div>
                    )}
                  </div>
                  <div className={styles.reqActions}>
                    {canAccept && (
                      <>
                        <button
                          type="button"
                          className={styles.btnAccept}
                          onClick={() => acceptRequest(r)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className={styles.btnDecline}
                          onClick={() => declineRequest(r.id)}
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        className={styles.btnDecline}
                        onClick={() => {
                          setCancelModalRequest(r);
                          setCancelReason("");
                        }}
                        disabled={cancellingRequestId === r.id}
                      >
                        {cancellingRequestId === r.id
                          ? "Cancelling..."
                          : "Cancel meeting"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className={`${styles.overlay} ${modalTarget ? styles.overlayOpen : ""}`}
        onClick={(e) => e.target === e.currentTarget && setModalTarget(null)}
      >
        {modalTarget && (
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Request meeting</h2>
            <p className={styles.modalSub}>
              Send a practice request to <strong>{modalTarget.name}</strong>
            </p>
            <form onSubmit={handleSendRequest}>
              <div className={styles.modalField}>
                <label>Message (optional)</label>
                <input
                  value={reqMsg}
                  onChange={(e) => setReqMsg(e.target.value)}
                  placeholder="e.g. Let's practice together"
                />
              </div>
              <div className={styles.modalBtns}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setModalTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSend}
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div
        className={`${styles.overlay} ${cancelModalRequest ? styles.overlayOpen : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setCancelModalRequest(null);
            setCancelReason("");
          }
        }}
      >
        {cancelModalRequest && (
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Cancel meeting</h2>
            <p className={styles.modalSub}>
              This will notify{" "}
              {currentUser?.id &&
              currentUser.id === cancelModalRequest.to_user_id
                ? cancelModalRequest.from_name
                : cancelModalRequest.to_name}{" "}
              immediately by email and site notification.
            </p>
            <form onSubmit={submitCancelMeeting}>
              <div className={styles.modalField}>
                <label>Reason (optional)</label>
                <input
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Sorry, I can't make it today"
                  maxLength={300}
                />
              </div>
              <div className={styles.modalBtns}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => {
                    setCancelModalRequest(null);
                    setCancelReason("");
                  }}
                >
                  Keep meeting
                </button>
                <button
                  type="submit"
                  className={styles.btnDanger}
                  disabled={cancellingRequestId === cancelModalRequest.id}
                >
                  {cancellingRequestId === cancelModalRequest.id
                    ? "Cancelling..."
                    : "Confirm cancel"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!deleteConfirmStudent}
        onClose={() => setDeleteConfirmStudent(null)}
        onConfirm={confirmDeleteSession}
        title="Delete availability session"
        message={`Delete the availability session for ${deleteConfirmStudent?.name}? Any pending requests to this session will also be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
