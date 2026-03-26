"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./page.module.css";

const GUEST_STORAGE_KEY = "practice_guest_profile_v1";

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
  { val: "available", label: "Available only" },
  { val: "morning", label: "Morning" },
  { val: "noon", label: "Noon & Afternoon" },
  { val: "evening", label: "Evening" },
  { val: "night", label: "Night" },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function slotLabel(value) {
  const found = TIME_SLOTS.find((s) => s.value === value);
  return found ? found.label : value;
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

function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  return new Date(`${dateStr}T${timeStr}`);
}

function buildDateString(year, month, day) {
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function formatAvailability(from, until) {
  if (!from || !until) return null;
  const dateFrom = new Date(from);
  const dateUntil = new Date(until);
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
  const timeUntil = dateUntil.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}, ${timeFrom} - ${timeUntil}`;
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

export default function ConversationPracticePage() {
  const [tab, setTab] = useState("browse");
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [toast, setToast] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [regName, setRegName] = useState("");
  const [regSlots, setRegSlots] = useState([]);
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const [regYear, setRegYear] = useState(String(currentYear));
  const [regMonth, setRegMonth] = useState(
    String(today.getMonth() + 1).padStart(2, "0"),
  );
  const [regDay, setRegDay] = useState(
    String(today.getDate()).padStart(2, "0"),
  );
  const [regStartTime, setRegStartTime] = useState("");
  const [regEndTime, setRegEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  const [modalTarget, setModalTarget] = useState(null);
  const [reqMsg, setReqMsg] = useState("");
  const [sending, setSending] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "requests") {
      setTab("requests");
    }
  }, []);

  const activeName = currentUser ? currentUserName : guestName;
  const activeEmail = currentUser ? currentUserEmail : guestEmail;

  const loadCurrentUser = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user || null;
    setCurrentUser(user);
    if (!user) {
      setCurrentUserName("");
      setCurrentUserEmail("");
      setIsAdmin(false);
      try {
        const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const guest = JSON.parse(raw);
          if (guest?.name) {
            setGuestName(guest.name);
            setRegName(guest.name);
          }
          if (guest?.email) {
            setGuestEmail(guest.email);
          }
        }
      } catch (e) {
        // ignore guest storage errors
      }
      return;
    }

    setCurrentUserEmail(user.email || "");
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, first_name, last_name, email, role")
      .eq("id", user.id)
      .maybeSingle();

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
    setGuestName("");
    setGuestEmail("");
  }, []);

  const fetchStudents = useCallback(async () => {
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
    setStudents(active);
  }, []);

  const fetchRequests = useCallback(async ({ userId, email }) => {
    if (!userId && !email) {
      setRequests([]);
      return;
    }

    let myStudent = null;
    if (userId) {
      const { data } = await supabase
        .from("practice_students")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      myStudent = data;
    }

    const { data, error } = await supabase
      .from("practice_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setDbError(error.message);
      return;
    }

    setDbError(null);
    const incoming = (data || []).filter(
      (r) =>
        (userId && r.to_user_id === userId) ||
        (email && r.to_email === email) ||
        (myStudent?.id && r.to_student_id === myStudent.id),
    );
    setRequests(incoming);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await loadCurrentUser();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadCurrentUser]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!currentUser?.id && !guestEmail) {
        await fetchStudents();
        setRequests([]);
        return;
      }
      await Promise.all([
        fetchStudents(),
        fetchRequests({
          userId: currentUser?.id,
          email: currentUser?.id ? null : guestEmail,
        }),
      ]);
      if (!cancelled) {
        setLoading(false);
      }
    })();

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
          if (currentUser?.id || guestEmail) {
            fetchRequests({
              userId: currentUser?.id,
              email: currentUser?.id ? null : guestEmail,
            });
          }
        },
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchStudents();
      if (currentUser?.id || guestEmail) {
        fetchRequests({
          userId: currentUser?.id,
          email: currentUser?.id ? null : guestEmail,
        });
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(chStudents);
      supabase.removeChannel(chRequests);
    };
  }, [currentUser?.id, guestEmail, fetchRequests, fetchStudents]);

  function saveGuestProfile() {
    const name = regName.trim();
    const email = (guestEmail || "").trim().toLowerCase();
    if (!name || !email) {
      showToast("Please enter guest name and email.");
      return;
    }
    setGuestName(name);
    setGuestEmail(email);
    try {
      window.localStorage.setItem(
        GUEST_STORAGE_KEY,
        JSON.stringify({ name, email }),
      );
    } catch (e) {
      // ignore local storage failure
    }
    showToast("Guest profile saved.");
  }

  function toggleRegSlot(val) {
    setRegSlots((prev) =>
      prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val],
    );
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!currentUser?.id && (!guestName || !guestEmail)) {
      showToast("Save guest profile first (name + email).");
      return;
    }

    const name = (currentUser ? regName : guestName).trim();
    if (!name) {
      showToast("Please enter your name first");
      return;
    }

    const regDate = buildDateString(regYear, regMonth, regDay);
    const fromDate = combineDateTime(regDate, regStartTime);
    const untilDate = combineDateTime(regDate, regEndTime);

    if (!fromDate || !untilDate) {
      showToast("Please select date, start time, and end time.");
      return;
    }

    if (untilDate <= fromDate) {
      showToast("End time must be after start time.");
      return;
    }

    setSaving(true);
    let error = null;
    if (currentUser?.id) {
      ({ error } = await supabase.from("practice_students").upsert(
        {
          user_id: currentUser.id,
          name,
          email: currentUserEmail,
          status: "available",
          slots: regSlots,
          available_from: fromDate.toISOString(),
          available_until: untilDate.toISOString(),
        },
        { onConflict: "user_id" },
      ));
    } else {
      const guestEmailNorm = guestEmail.trim().toLowerCase();
      const { data: existingGuest } = await supabase
        .from("practice_students")
        .select("id")
        .eq("email", guestEmailNorm)
        .is("user_id", null)
        .maybeSingle();

      if (existingGuest?.id) {
        ({ error } = await supabase
          .from("practice_students")
          .update({
            name,
            email: guestEmailNorm,
            status: "available",
            slots: regSlots,
            available_from: fromDate.toISOString(),
            available_until: untilDate.toISOString(),
          })
          .eq("id", existingGuest.id));
      } else {
        ({ error } = await supabase.from("practice_students").insert({
          user_id: null,
          name,
          email: guestEmailNorm,
          status: "available",
          slots: regSlots,
          available_from: fromDate.toISOString(),
          available_until: untilDate.toISOString(),
        }));
      }
    }

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
    if (!currentUser?.id && (!guestName || !guestEmail)) {
      showToast("Save guest profile first (name + email).");
      return;
    }
    if (!modalTarget) return;
    if (!modalTarget.user_id && !modalTarget.email) {
      showToast("This target does not have a valid identity yet.");
      return;
    }

    setSending(true);
    const { data: insertedRows, error } = await supabase
      .from("practice_requests")
      .insert({
        from_user_id: currentUser?.id || null,
        from_name: activeName || regName || "Student",
        from_email: activeEmail || null,
        to_user_id: modalTarget.user_id || null,
        to_student_id: modalTarget.id,
        to_name: modalTarget.name,
        to_email: modalTarget.email || null,
        suggested_time: `${new Date(modalTarget.available_from).toLocaleString()} - ${new Date(modalTarget.available_until).toLocaleTimeString()}`,
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
    const requestId = insertedRows?.[0]?.id;
    try {
      if (requestId) {
        await fetch("/api/practice/request-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId }),
        });
      }
    } catch (e) {
      // non-fatal
    }
    setModalTarget(null);
    setReqMsg("");
    await fetchRequests({
      userId: currentUser?.id,
      email: currentUser?.id ? null : guestEmail,
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
        email: currentUser?.id ? null : guestEmail,
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
      email: currentUser?.id ? null : guestEmail,
    });
  }

  async function deleteAvailabilitySession(student) {
    if (!isAdmin) return;
    const ok = window.confirm(
      `Delete availability session for ${student.name}?`,
    );
    if (!ok) return;

    const { error } = await supabase
      .from("practice_students")
      .delete()
      .eq("id", student.id);

    if (error) {
      showToast("Could not delete this session");
      return;
    }

    // Clean pending requests targeted to the deleted session
    await supabase
      .from("practice_requests")
      .delete()
      .eq("status", "pending")
      .eq("to_student_id", student.id);

    showToast("Availability session deleted");
    await fetchStudents();
    if (currentUser?.id || guestEmail) {
      await fetchRequests({
        userId: currentUser?.id,
        email: currentUser?.id ? null : guestEmail,
      });
    }
  }

  const filtered = useMemo(
    () => students.filter((s) => matchesFilter(s, filter)),
    [students, filter],
  );
  const yearOptions = useMemo(
    () => [String(currentYear), String(currentYear + 1)],
    [currentYear],
  );
  const dayOptions = useMemo(() => {
    if (!regYear || !regMonth) return [];
    const daysInMonth = new Date(
      Number(regYear),
      Number(regMonth),
      0,
    ).getDate();
    return Array.from({ length: daysInMonth }, (_, i) =>
      String(i + 1).padStart(2, "0"),
    );
  }, [regYear, regMonth]);

  useEffect(() => {
    if (!dayOptions.length) return;
    if (!regDay || !dayOptions.includes(regDay)) {
      setRegDay(dayOptions[0]);
    }
  }, [dayOptions, regDay]);
  const availableCount = students.length;
  const pendingCount = requests.length;

  if (loading) {
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
        <div className={styles.logo}>
          <div className={styles.logoDot}>💬</div>
          <div>
            <div className={styles.logoText}>Conversation Practice</div>
            <div className={styles.logoSub}>
              Find a classmate to practice with
            </div>
          </div>
        </div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          <span>{availableCount} available now</span>
        </div>
      </header>

      {!currentUser && (
        <div className={styles.setupHint}>Enter your name and email</div>
      )}

      {dbError && (
        <div className={styles.setupHint} role="alert">
          Could not connect to required practice tables. Run the SQL migration
          then refresh. Details: {dbError}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{students.length}</div>
          <div className={styles.statLabel}>Available students</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.statNumAccent}`}>
            {availableCount}
          </div>
          <div className={styles.statLabel}>Live now</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statNum} ${styles.statNumAccent}`}>
            {pendingCount}
          </div>
          <div className={styles.statLabel}>Incoming requests</div>
        </div>
      </div>

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
          Incoming requests
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
              <div className={styles.emptyIcon}>👥</div>
              <div className={styles.emptyText}>
                No students currently available.
              </div>
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className={`${styles.studentCard} ${styles.studentCardAvailable}`}
              >
                <div className={styles.cardTop}>
                  <div
                    className={`${styles.avatar} ${avatarClassForName(s.name || "")}`}
                  >
                    {initials(s.name)}
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
                <div className={styles.cardSlots}>
                  {(s.slots || []).map((sl) => (
                    <span key={sl} className={styles.slotPill}>
                      {slotLabel(sl)}
                    </span>
                  ))}
                  {formatAvailability(s.available_from, s.available_until) && (
                    <span className={styles.slotPill}>
                      {formatAvailability(s.available_from, s.available_until)}
                    </span>
                  )}
                </div>
                {(() => {
                  const isOwnCard =
                    (currentUser?.id && currentUser.id === s.user_id) ||
                    (!currentUser?.id &&
                      guestEmail &&
                      s.email &&
                      guestEmail.trim().toLowerCase() ===
                        s.email.trim().toLowerCase());
                  return isOwnCard ? (
                    <button
                      type="button"
                      className={`${styles.btnRequest} ${styles.btnBusy}`}
                      disabled
                    >
                      Your availability card
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnRequest}
                      onClick={() => setModalTarget(s)}
                    >
                      Request meeting
                    </button>
                  );
                })()}
                {isAdmin && (
                  <button
                    type="button"
                    className={`${styles.btnRequest} ${styles.btnAdminDelete}`}
                    onClick={() => deleteAvailabilitySession(s)}
                  >
                    Delete session (Admin)
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className={`${styles.section} ${tab === "register" ? styles.sectionActive : ""}`}
      >
        <form className={styles.formCard} onSubmit={handleRegister}>
          <h2 className={styles.formTitle}>Set your availability</h2>
          <div className={styles.field}>
            <label>Your name</label>
            <input
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
            />
          </div>
          {!currentUser && (
            <>
              <div className={styles.field}>
                <label>Guest email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                />
              </div>
              <div className={styles.field}>
                <button
                  type="button"
                  className={styles.btnSubmit}
                  onClick={saveGuestProfile}
                >
                  Save guest profile
                </button>
              </div>
            </>
          )}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Preferred time slots</span>
            <div className={styles.slotsPicker}>
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  className={`${styles.slotBtn} ${regSlots.includes(slot.value) ? styles.slotBtnPicked : ""}`}
                  onClick={() => toggleRegSlot(slot.value)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.field}>
            <label>Date</label>
            <div className={styles.slotsPicker}>
              <select
                value={regYear}
                onChange={(e) => setRegYear(e.target.value)}
              >
                <option value="">Year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={regMonth}
                onChange={(e) => setRegMonth(e.target.value)}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={regDay}
                onChange={(e) => setRegDay(e.target.value)}
              >
                <option value="">Day</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Start time</label>
            <select
              value={regStartTime}
              onChange={(e) => setRegStartTime(e.target.value)}
            >
              <option value="">Select start time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={`start-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>End time</label>
            <select
              value={regEndTime}
              onChange={(e) => setRegEndTime(e.target.value)}
            >
              <option value="">Select end time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={`end-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.btnSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save my availability"}
          </button>
        </form>
      </div>

      <div
        id="incoming-requests"
        className={`${styles.section} ${tab === "requests" ? styles.sectionActive : ""}`}
      >
        {requests.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📨</div>
            <div className={styles.emptyText}>No pending requests</div>
          </div>
        ) : (
          <div className={styles.reqList}>
            {requests.map((r, i) => (
              <div key={r.id} className={styles.reqCard}>
                <div
                  className={`${styles.reqAvatar} ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                >
                  {initials(r.from_name)}
                </div>
                <div className={styles.reqInfo}>
                  <div className={styles.reqName}>
                    {r.from_name} → {r.to_name}
                  </div>
                  <div className={styles.reqDetail}>
                    {r.suggested_time}
                    {r.message ? ` · ${r.message}` : ""}
                  </div>
                </div>
                <div className={styles.reqActions}>
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
                </div>
              </div>
            ))}
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
              Send a practice request to {modalTarget.name}
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

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>
        {toast || "\u00a0"}
      </div>
    </div>
  );
}
