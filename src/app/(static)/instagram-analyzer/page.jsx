"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { unzip, strFromU8 } from "fflate";
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
  const [zipBusy, setZipBusy]             = useState(false);
  const [zipStatus, setZipStatus]         = useState("");
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

  const handleNotFoundUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setNotFoundFile(file);
    setError("");
    try {
      const nfResult = await parseInstagramData(file);
      const uploaded = nfResult.usernames.map(normalize).filter(Boolean);
      if (uploaded.length > 0) {
        setNotFound((prev) => new Set([...prev, ...uploaded]));
      }
    } catch (e) {
      setError(
        "Couldn't read that not-found file. Make sure it's the file you previously saved from this tool."
      );
    }
  };

  const handleZipUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError("");
    setZipStatus("");
    setZipBusy(true);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      // Only decompress the small follower/following JSON files, never media.
      const entries = await new Promise((resolve, reject) => {
        unzip(
          buffer,
          {
            filter: (f) =>
              /\.json$/i.test(f.name) && /(followers|following)/i.test(f.name),
          },
          (err, data) => (err ? reject(err) : resolve(data))
        );
      });

      const followerEntries = [];
      let followingText = null;

      for (const path in entries) {
        const base = path.split("/").pop().toLowerCase();
        if (base.startsWith("following")) {
          followingText = strFromU8(entries[path]);
        } else if (base.startsWith("followers")) {
          followerEntries.push(strFromU8(entries[path]));
        }
      }

      if (followerEntries.length === 0 || !followingText) {
        setError(
          "Couldn't find the followers and following files inside that ZIP. Make sure you requested your data in JSON format and uploaded the original ZIP Instagram sent you, then try again."
        );
        return;
      }

      // Followers can be split across followers_1.json, followers_2.json, etc.
      let mergedFollowers = [];
      for (const text of followerEntries) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          mergedFollowers.push(...parsed);
        } else if (Array.isArray(parsed.relationships_followers)) {
          mergedFollowers.push(...parsed.relationships_followers);
        } else {
          for (const key in parsed) {
            if (Array.isArray(parsed[key])) {
              mergedFollowers.push(...parsed[key]);
              break;
            }
          }
        }
      }

      const followersBlob = new File(
        [JSON.stringify(mergedFollowers)],
        "followers.json",
        { type: "application/json" }
      );
      const followingBlob = new File([followingText], "following.json", {
        type: "application/json",
      });

      setFollowersFile(followersBlob);
      setFollowingFile(followingBlob);
      setZipStatus("Files found in your ZIP — analyzing…");

      await compareFollowers(followersBlob, followingBlob);
    } catch (err) {
      setError(
        "Couldn't read that ZIP file. Make sure it's the unedited ZIP Instagram sent you (in JSON format) and try again."
      );
    } finally {
      setZipBusy(false);
      const zi = document.getElementById("zip-input");
      if (zi) zi.value = "";
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

  const compareFollowers = async (fFile = followersFile, gFile = followingFile) => {
    if (!fFile || !gFile) {
      setError("Please upload both the followers and following files");
      return;
    }
    setIsProcessing(true);
    setError("");
    try {
      const [followersResult, followingResult] = await Promise.all([
        parseInstagramData(fFile),
        parseInstagramData(gFile),
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
    setZipStatus("");
    const nfi = document.getElementById("notfound-input");
    const zi = document.getElementById("zip-input");
    if (nfi) nfi.value = "";
    if (zi) zi.value = "";
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

  const handledCount  = useMemo(() => results.filter((u) => handled.has(normalize(u))).length,  [results, handled]);
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
              Drop your Instagram data ZIP to find out who isn&apos;t following you back.
            </p>
            <div className={styles.instructions}>
              <h3 className={styles.instructionsTitle}>
                How to get your Instagram data
              </h3>
              <ol className={styles.steps}>
                <li className={styles.step}>
                  <span className={styles.stepNum}>1</span>
                  <div className={styles.stepText}>
                    <strong>Open &ldquo;Download your information&rdquo;</strong>
                    <p>
                      In the Instagram app, tap your profile, open the menu
                      (☰), then go to <em>Your activity → Download your
                      information</em>.
                    </p>
                  </div>
                </li>
                <li className={styles.step}>
                  <span className={styles.stepNum}>2</span>
                  <div className={styles.stepText}>
                    <strong>Request your data in JSON format</strong>
                    <p>
                      Choose <em>Some of your information</em>, select{" "}
                      <em>Followers and following</em>, then set the format to{" "}
                      <strong>JSON</strong> and submit the request.
                    </p>
                  </div>
                </li>
                <li className={styles.step}>
                  <span className={styles.stepNum}>3</span>
                  <div className={styles.stepText}>
                    <strong>Download the ZIP from Instagram</strong>
                    <p>
                      Instagram emails you a download link once it&apos;s ready
                      (usually a few minutes to a few hours). Open it and save
                      the ZIP file to your device.
                    </p>
                  </div>
                </li>
                <li className={styles.step}>
                  <span className={styles.stepNum}>4</span>
                  <div className={styles.stepText}>
                    <strong>Drop the ZIP below</strong>
                    <p>
                      Upload it here — we&apos;ll automatically find your
                      followers and following files and run the analysis. No
                      need to unzip anything yourself.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <Link
              href="/blog/how-to-see-who-doesnt-follow-you-back-on-instagram"
              className={styles.guideLink}
            >
              → New here? Read the full step-by-step guide
            </Link>
          </div>

          <div className={styles.zipCard}>
            <h3 className={styles.cardTitle}>Upload your Instagram ZIP</h3>
            <p className={styles.cardDescription}>
              Just drop the ZIP file you downloaded from Instagram — we&apos;ll
              find the followers and following files for you automatically and
              start the analysis. Nothing is uploaded to a server; everything
              runs in your browser.
            </p>
            <input
              id="zip-input"
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              disabled={zipBusy || isProcessing}
              className={styles.fileInput}
            />
            <label
              htmlFor="zip-input"
              className={`${styles.fileButton} ${
                zipBusy ? styles.fileButtonBusy : ""
              }`}
            >
              {zipBusy ? "Reading ZIP…" : "Choose ZIP File"}
            </label>
            {zipStatus && <p className={styles.zipStatus}>{zipStatus}</p>}
          </div>

          <details className={styles.optionalDetails}>
            <summary className={styles.optionalSummary}>
              Returning user? Restore your saved &ldquo;not-found&rdquo; list
              (optional)
            </summary>
            <div className={styles.optionalBody}>
              <p className={styles.cardDescription}>
                As you review your results, you can mark accounts as
                <strong> &ldquo;not found&rdquo;</strong> — for example, profiles
                that were deleted, deactivated, or you simply couldn&apos;t
                locate. Those stay hidden so you don&apos;t keep re-checking
                them, and you can export them as a small JSON file to keep for
                next time.
              </p>
              <p className={styles.cardDescription}>
                If you saved that file on a previous visit, upload it
                <strong> before</strong> dropping your ZIP and those accounts
                will be hidden automatically in your new results.
              </p>
              <input
                id="notfound-input"
                type="file"
                accept=".json"
                onChange={handleNotFoundUpload}
                className={styles.fileInput}
              />
              <label htmlFor="notfound-input" className={styles.fileButton}>
                {notFoundFile ? notFoundFile.name : "Choose Not-Found File"}
              </label>
            </div>
          </details>

          {error && <div className={styles.errorMessage}>{error}</div>}

          {notFoundFile && (
            <div className={styles.actions}>
              <button
                onClick={resetAnalysis}
                className={`${styles.button} ${styles.secondaryButton}`}
              >
                Reset
              </button>
            </div>
          )}
        </>
      )}

      {results.length > 0 && (
        <div className={styles.resultsSection}>

          {/* ── Header ── */}
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitleWrap}>
              <h2 className={styles.resultsTitle}>{results.length} not following you back</h2>
              <p className={styles.resultsSubtitle}>
                Review each account — mark unfollowed, keep, or skip.
              </p>
            </div>
            <button onClick={resetAnalysis} className={styles.newAnalysisBtn}>
              ↺ New Analysis
            </button>
          </div>

          {/* ── Progress ── */}
          <div className={styles.progressWrap}>
            <div className={styles.progressText}>
              <span>{decidedCount} of {results.length} reviewed</span>
              <span className={styles.progressPct}>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* ── Save not-found prompt ── */}
          {notFoundCount > 0 && (
            <div className={styles.notFoundSaveBar}>
              <div className={styles.notFoundSaveLeft}>
                <span className={styles.notFoundSaveIcon}>⊘</span>
                <div>
                  <p className={styles.notFoundSaveTitle}>Save your not-found list</p>
                  <p className={styles.notFoundSaveDesc}>
                    You marked {notFoundCount} account{notFoundCount !== 1 ? "s" : ""} as deleted or deactivated.
                    Download this file and upload it before your next analysis — those accounts will be hidden automatically.
                  </p>
                </div>
              </div>
              <button onClick={downloadNotFound} className={styles.notFoundSaveBtn}>
                ↓ Download list
              </button>
            </div>
          )}

          {/* ── Controls ── */}
          <div className={styles.controlsRow}>
            <input
              type="text"
              placeholder="Search username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.filterChips}>
              <button
                onClick={() => setShowHandled((v) => !v)}
                className={`${styles.filterChip} ${showHandled ? styles.filterChipUnfollow : ""}`}
              >
                ✕ Unfollowed{handledCount > 0 ? ` (${handledCount})` : ""}
              </button>
              <button
                onClick={() => setShowKept((v) => !v)}
                className={`${styles.filterChip} ${showKept ? styles.filterChipKeep : ""}`}
              >
                ♥ Keeping{keptCount > 0 ? ` (${keptCount})` : ""}
              </button>
              <button
                onClick={() => setShowNotFound((v) => !v)}
                className={`${styles.filterChip} ${showNotFound ? styles.filterChipGone : ""}`}
              >
                ⊘ Not found{notFoundCount > 0 ? ` (${notFoundCount})` : ""}
              </button>
            </div>
          </div>

          {/* ── List ── */}
          <div className={styles.resultsList}>
            {filteredResults.length === 0 ? (
              <div className={styles.emptyState}>No accounts match your filters.</div>
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
                      <a
                        href={`https://www.instagram.com/${username}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.usernameLink}
                      >
                        <span className={styles.usernameAt}>@</span>
                        <span className={styles.username}>{username}</span>
                        <span className={styles.externalArrow}>↗</span>
                      </a>
                      <div className={styles.actionGroup}>
                        <button
                          onClick={() => toggleHandled(username)}
                          className={`${styles.actionChip} ${isHandled ? styles.chipUnfollowActive : ""}`}
                          title="Mark as unfollowed"
                        >
                          <span className={styles.chipIcon}>✕</span>
                          <span className={styles.chipLabel}>Unfollow</span>
                        </button>
                        <button
                          onClick={() => toggleKept(username)}
                          className={`${styles.actionChip} ${isKept ? styles.chipKeepActive : ""}`}
                          title="Keep following"
                        >
                          <span className={styles.chipIcon}>♥</span>
                          <span className={styles.chipLabel}>Keep</span>
                        </button>
                        <button
                          onClick={() => toggleNotFound(username)}
                          className={`${styles.actionChip} ${isNotFound ? styles.chipGoneActive : ""}`}
                          title="Account deleted or deactivated"
                        >
                          <span className={styles.chipIcon}>⊘</span>
                          <span className={styles.chipLabel}>Gone</span>
                        </button>
                      </div>
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
