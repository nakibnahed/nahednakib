"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const STORAGE_KEY      = "ig-analyzer-handled";
const KEPT_KEY         = "ig-analyzer-kept";
const NOT_FOUND_KEY    = "ig-analyzer-notfound";
const normalize        = (u) => (u ?? "").toString().trim().toLowerCase();

const loadSet = (key) => {
  if (typeof window === "undefined") return new Set();
  try {
    const v = localStorage.getItem(key);
    return v ? new Set(JSON.parse(v)) : new Set();
  } catch (e) {
    return new Set();
  }
};

export default function InstagramAnalyzer() {
  const [followersFile, setFollowersFile] = useState(null);
  const [followingFile, setFollowingFile] = useState(null);
  const [notFoundFile, setNotFoundFile]   = useState(null);
  const [results, setResults]             = useState([]);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [error, setError]                 = useState("");
  const [handled, setHandled]             = useState(() => loadSet(STORAGE_KEY));
  const [kept, setKept]                   = useState(() => loadSet(KEPT_KEY));
  const [notFound, setNotFound]           = useState(() => loadSet(NOT_FOUND_KEY));
  const [searchQuery, setSearchQuery]     = useState("");
  const [showHandled, setShowHandled]     = useState(false);
  const [showKept, setShowKept]           = useState(true);
  const [showNotFound, setShowNotFound]   = useState(false);
  const [copiedUser, setCopiedUser]       = useState(null);


  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY,   JSON.stringify([...handled]));  } catch (e) {}
  }, [handled]);

  useEffect(() => {
    try { localStorage.setItem(KEPT_KEY,      JSON.stringify([...kept]));     } catch (e) {}
  }, [kept]);

  useEffect(() => {
    try { localStorage.setItem(NOT_FOUND_KEY, JSON.stringify([...notFound])); } catch (e) {}
  }, [notFound]);

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === "followers") setFollowersFile(file);
      else if (type === "following") setFollowingFile(file);
      else if (type === "notfound") setNotFoundFile(file);
      setError("");
    }
  };

  const parseInstagramData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          let usernames = [];

          if (Array.isArray(data)) {
            usernames = data.map((user) => {
              if (typeof user === "string") return user;
              if (user.string_list_data?.[0]?.value) return user.string_list_data[0].value;
              if (user.username) return user.username;
              if (user.value)    return user.value;
              if (user.title)    return user.title;
              return user;
            });
          } else if (data.relationships_followers && Array.isArray(data.relationships_followers)) {
            usernames = data.relationships_followers.map((user) => {
              if (user.string_list_data?.[0]?.value) return user.string_list_data[0].value;
              if (user.title) return user.title;
              return user;
            });
          } else if (data.relationships_following && Array.isArray(data.relationships_following)) {
            usernames = data.relationships_following.map((user) => {
              if (user.title) return user.title;
              if (user.string_list_data?.[0]?.value) return user.string_list_data[0].value;
              return user;
            });
          } else if (data.followers && Array.isArray(data.followers)) {
            usernames = data.followers.map((user) =>
              typeof user === "string" ? user : user.username || user.value
            );
          } else if (data.following && Array.isArray(data.following)) {
            usernames = data.following.map((user) =>
              typeof user === "string" ? user : user.username || user.value
            );
          } else {
            for (const key in data) {
              if (Array.isArray(data[key])) {
                usernames = data[key].map((user) => {
                  if (typeof user === "string") return user;
                  if (user.title)    return user.title;
                  if (user.string_list_data?.[0]?.value) return user.string_list_data[0].value;
                  if (user.username) return user.username;
                  if (user.value)    return user.value;
                  return user;
                });
                break;
              }
            }
          }

          resolve({
            usernames: usernames
              .filter((u) => u && typeof u === "string")
              .map((u) => u.trim())
              .filter(Boolean),
          });
        } catch (err) {
          reject(new Error("Invalid JSON file: " + err.message));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  const compareFollowers = async () => {
    if (!followersFile || !followingFile) {
      setError("Please upload both the followers and following files");
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      const [followersResult, followingResult] = await Promise.all([
        parseInstagramData(followersFile),
        parseInstagramData(followingFile),
      ]);
      const followers = followersResult.usernames;
      const following = followingResult.usernames;

      const followersSet = new Set(followers.map(normalize).filter(Boolean));
      const seen = new Set();
      const notFollowingBack = [];
      for (const u of following) {
        const n = normalize(u);
        if (!n || followersSet.has(n) || seen.has(n)) continue;
        seen.add(n);
        notFollowingBack.push(u);
      }

      setResults(notFollowingBack);

      if (notFoundFile) {
        try {
          const nfResult = await parseInstagramData(notFoundFile);
          const uploaded = nfResult.usernames.map(normalize).filter(Boolean);
          if (uploaded.length > 0) {
            setNotFound((prev) => new Set([...prev, ...uploaded]));
          }
        } catch (e) {}
      }

      if (followers.length === 0 || following.length === 0) {
        setError(
          `Parsing issue: Found ${followers.length} followers and ${following.length} following. Make sure you uploaded the correct files.`
        );
      } else if (notFollowingBack.length === 0) {
        setError("Everyone you follow is following you back! 🎉");
      }
    } catch (err) {
      setError(err.message || "Error processing files");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearOtherMarkers = (username, skip) => {
    const n = normalize(username);
    if (skip !== "handled")  setHandled((p)  => { const s = new Set(p); s.delete(n); return s; });
    if (skip !== "kept")     setKept((p)     => { const s = new Set(p); s.delete(n); return s; });
    if (skip !== "notFound") setNotFound((p) => { const s = new Set(p); s.delete(n); return s; });
  };

  const toggleHandled = (username) => {
    const n = normalize(username);
    setHandled((prev) => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); return next; }
      clearOtherMarkers(username, "handled");
      next.add(n);
      return next;
    });
  };

  const toggleKept = (username) => {
    const n = normalize(username);
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); return next; }
      clearOtherMarkers(username, "kept");
      next.add(n);
      return next;
    });
  };

  const toggleNotFound = (username) => {
    const n = normalize(username);
    setNotFound((prev) => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); return next; }
      clearOtherMarkers(username, "notFound");
      next.add(n);
      return next;
    });
  };

  const copyProfileUrl = async (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`https://www.instagram.com/${username}/`);
      setCopiedUser(username);
      setTimeout(() => setCopiedUser(null), 1500);
    } catch (err) {}
  };

  const downloadNotFound = () => {
    const list = [...notFound];
    if (list.length === 0) return;
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "not-found-accounts.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyRemaining = async () => {
    const remaining = results.filter((u) => {
      const n = normalize(u);
      return !handled.has(n) && !kept.has(n) && !notFound.has(n);
    });
    try {
      await navigator.clipboard.writeText(remaining.map((u) => "@" + u).join("\n"));
    } catch (e) {}
  };

  const resetAnalysis = () => {
    setFollowersFile(null);
    setFollowingFile(null);
    setResults([]);
    setError("");
    setSearchQuery("");
    setShowHandled(false);
    setShowKept(true);
    setShowNotFound(false);
    setHandled(new Set());
    setKept(new Set());
    setNotFound(new Set());
    setNotFoundFile(null);
    const fi = document.getElementById("followers-input");
    const gi = document.getElementById("following-input");
    const nfi = document.getElementById("notfound-input");
    if (fi) fi.value = "";
    if (gi) gi.value = "";
    if (nfi) nfi.value = "";
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return results.filter((u) => {
      const n = normalize(u);
      if (!showHandled  && handled.has(n))  return false;
      if (!showKept     && kept.has(n))     return false;
      if (!showNotFound && notFound.has(n)) return false;
      if (q && !u.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [results, searchQuery, showHandled, showKept, showNotFound, handled, kept, notFound]);

  const decidedCount = useMemo(
    () => results.filter((u) => {
      const n = normalize(u);
      return handled.has(n) || kept.has(n) || notFound.has(n);
    }).length,
    [results, handled, kept, notFound]
  );

  const keptCount     = useMemo(() => results.filter((u) => kept.has(normalize(u))).length,     [results, kept]);
  const notFoundCount = useMemo(() => results.filter((u) => notFound.has(normalize(u))).length, [results, notFound]);

  const progress = results.length
    ? Math.round((decidedCount / results.length) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {results.length === 0 && (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>Instagram Follower Analyzer</h1>
            <p className={styles.description}>
              Upload your followers and following files to find out who isn&apos;t following you back.
            </p>
            <div className={styles.instructions}>
              <h3>How to get your Instagram data:</h3>
              <ol>
                <li>Instagram Settings → Your activity → Download your information</li>
                <li>Request your data and download the ZIP file</li>
                <li>Extract the ZIP and find the JSON files for followers and following</li>
                <li>Upload both files here to analyze</li>
              </ol>
            </div>
            <Link
              href="/blog/how-to-see-who-doesnt-follow-you-back-on-instagram"
              className={styles.guideLink}
            >
              → New here? Read the full step-by-step guide
            </Link>
          </div>

          <div className={styles.uploadSection}>
            <div className={styles.uploadCard}>
              <h3 className={styles.cardTitle}>Upload Followers Data</h3>
              <p className={styles.cardDescription}>
                Upload the JSON file containing your followers list from your Instagram data export.
              </p>
              <input
                id="followers-input"
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, "followers")}
                className={styles.fileInput}
              />
              <label htmlFor="followers-input" className={styles.fileButton}>
                {followersFile ? followersFile.name : "Choose Followers File"}
              </label>
            </div>

            <div className={styles.uploadCard}>
              <h3 className={styles.cardTitle}>Upload Following Data</h3>
              <p className={styles.cardDescription}>
                Upload the JSON file containing your following list from your Instagram data export.
              </p>
              <input
                id="following-input"
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, "following")}
                className={styles.fileInput}
              />
              <label htmlFor="following-input" className={styles.fileButton}>
                {followingFile ? followingFile.name : "Choose Following File"}
              </label>
            </div>

            <div className={`${styles.uploadCard} ${styles.optionalCard}`}>
              <h3 className={styles.cardTitle}>Not-Found Accounts (Optional)</h3>
              <p className={styles.cardDescription}>
                If you saved a not-found file before, upload it to auto-hide those accounts.
              </p>
              <input
                id="notfound-input"
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, "notfound")}
                className={styles.fileInput}
              />
              <label htmlFor="notfound-input" className={styles.fileButton}>
                {notFoundFile ? notFoundFile.name : "Choose Not-Found File (optional)"}
              </label>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.actions}>
            <button
              onClick={compareFollowers}
              disabled={isProcessing || !followersFile || !followingFile}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              {isProcessing ? "Analyzing..." : "Analyze Followers"}
            </button>

            {(followersFile || followingFile) && (
              <button
                onClick={resetAnalysis}
                className={`${styles.button} ${styles.secondaryButton}`}
              >
                Reset
              </button>
            )}
          </div>
        </>
      )}

      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.resultsTitle}>
                Accounts Not Following You Back ({results.length})
              </h2>
              <div className={styles.badgeRow}>
                {keptCount > 0 && (
                  <span className={styles.keptBadge}>♥ {keptCount} kept</span>
                )}
                {notFoundCount > 0 && (
                  <span
                    className={styles.notFoundBadge}
                    onClick={() => setShowNotFound((v) => !v)}
                    title="Click to show/hide not-found accounts"
                  >
                    ? {notFoundCount} not found {showNotFound ? "" : "(hidden)"}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={resetAnalysis}
              className={`${styles.button} ${styles.primaryButton} ${styles.resetBtn}`}
            >
              New Analysis
            </button>
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressText}>
              <span>Decided {decidedCount} of {results.length}</span>
              <span>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.controlsBar}>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              onClick={() => setShowHandled((v) => !v)}
              className={`${styles.filterChip} ${showHandled ? styles.filterChipUnfollow : ""}`}
            >
              ✕ Handled
            </button>
            <button
              onClick={() => setShowKept((v) => !v)}
              className={`${styles.filterChip} ${showKept ? styles.filterChipKeep : ""}`}
            >
              ♥ Kept
            </button>
            <button
              onClick={() => setShowNotFound((v) => !v)}
              className={`${styles.filterChip} ${showNotFound ? styles.filterChipGone : ""}`}
            >
              ⊘ Not found
            </button>
            <button onClick={copyRemaining} className={styles.miniButton}>
              Copy Remaining
            </button>
            {notFoundCount > 0 && (
              <button onClick={downloadNotFound} className={styles.miniButton}>
                Download not-found
              </button>
            )}
          </div>

          <div className={styles.resultsList}>
            {filteredResults.length === 0 ? (
              <div className={styles.emptyState}>No results match your search.</div>
            ) : (
              filteredResults.map((username) => {
                const isHandled  = handled.has(normalize(username));
                const isKept     = kept.has(normalize(username));
                const isNotFound = notFound.has(normalize(username));
                return (
                  <div
                    key={username}
                    className={[
                      styles.resultItem,
                      isHandled  ? styles.handledItem  : "",
                      isKept     ? styles.keptItem     : "",
                      isNotFound ? styles.notFoundItem : "",
                    ].join(" ")}
                  >
                    <div className={styles.resultContent}>
                      <div className={styles.actionGroup}>
                        <button
                          onClick={() => toggleHandled(username)}
                          className={`${styles.actionChip} ${isHandled ? styles.chipUnfollowActive : ""}`}
                          title="Mark as unfollowed"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => toggleKept(username)}
                          className={`${styles.actionChip} ${isKept ? styles.chipKeepActive : ""}`}
                          title="Keep following"
                        >
                          ♥
                        </button>
                        <button
                          onClick={() => toggleNotFound(username)}
                          className={`${styles.actionChip} ${isNotFound ? styles.chipGoneActive : ""}`}
                          title="Account deleted or deactivated"
                        >
                          ⊘
                        </button>
                      </div>
                      <a
                        href={`https://www.instagram.com/${username}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.usernameLink}
                      >
                        <span className={styles.usernameIcon}>@</span>
                        <span className={styles.username}>{username}</span>
                        <span className={styles.externalLink}>↗</span>
                      </a>
                      <button
                        onClick={(e) => copyProfileUrl(e, username)}
                        className={styles.copyBtn}
                        title="Copy link to open in browser"
                      >
                        {copiedUser === username ? "✓" : "⎘"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
