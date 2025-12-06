"use client";
import { useState } from "react";
import styles from "./page.module.css";

export default function InstagramAnalyzer() {
  const [followersFile, setFollowersFile] = useState(null);
  const [followingFile, setFollowingFile] = useState(null);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState({
    followers: 0,
    following: 0,
    dataStructure: "",
  });
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === "followers") {
        setFollowersFile(file);
      } else {
        setFollowingFile(file);
      }
      setError("");
    }
  };

  const parseInstagramData = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          console.log("Parsed data structure:", JSON.stringify(data, null, 2));

          // Instagram data structure may vary, we'll handle common formats
          let usernames = [];

          // Check for different possible structures
          if (Array.isArray(data)) {
            // Direct array of users (followers format)
            console.log("Detected direct array format (followers)");
            usernames = data.map((user) => {
              if (typeof user === "string") {
                return user;
              } else if (
                user.string_list_data &&
                user.string_list_data[0] &&
                user.string_list_data[0].value
              ) {
                return user.string_list_data[0].value;
              } else if (user.username) {
                return user.username;
              } else if (user.value) {
                return user.value;
              } else if (user.title) {
                return user.title;
              } else {
                return user;
              }
            });
          } else if (
            data.relationships_followers &&
            Array.isArray(data.relationships_followers)
          ) {
            // Instagram export format for followers
            console.log("Detected relationships_followers format");
            usernames = data.relationships_followers.map((user) => {
              if (
                user.string_list_data &&
                user.string_list_data[0] &&
                user.string_list_data[0].value
              ) {
                return user.string_list_data[0].value;
              } else if (user.title) {
                return user.title;
              } else {
                return user;
              }
            });
          } else if (
            data.relationships_following &&
            Array.isArray(data.relationships_following)
          ) {
            // Instagram export format for following (usernames in title field)
            console.log("Detected relationships_following format");
            usernames = data.relationships_following.map((user) => {
              if (user.title) {
                return user.title;
              } else if (
                user.string_list_data &&
                user.string_list_data[0] &&
                user.string_list_data[0].value
              ) {
                return user.string_list_data[0].value;
              } else {
                return user;
              }
            });
          } else if (data.followers && Array.isArray(data.followers)) {
            // Alternative format
            console.log("Detected followers format");
            usernames = data.followers.map((user) =>
              typeof user === "string" ? user : user.username || user.value
            );
          } else if (data.following && Array.isArray(data.following)) {
            // Following format
            console.log("Detected following format");
            usernames = data.following.map((user) =>
              typeof user === "string" ? user : user.username || user.value
            );
          } else {
            // Try to find any array in the data
            console.log("Trying to find arrays in data...");
            for (const key in data) {
              if (Array.isArray(data[key])) {
                console.log(`Found array in key: ${key}`);
                usernames = data[key].map((user) => {
                  if (typeof user === "string") {
                    return user;
                  } else if (user.title) {
                    return user.title;
                  } else if (
                    user.string_list_data &&
                    user.string_list_data[0] &&
                    user.string_list_data[0].value
                  ) {
                    return user.string_list_data[0].value;
                  } else if (user.username) {
                    return user.username;
                  } else if (user.value) {
                    return user.value;
                  } else {
                    return user;
                  }
                });
                break;
              }
            }
          }

          const filteredUsernames = usernames.filter(
            (username) => username && typeof username === "string"
          );

          console.log(
            `Extracted ${filteredUsernames.length} usernames:`,
            filteredUsernames.slice(0, 10)
          );

          if (filteredUsernames.length === 0) {
            console.error(
              "No usernames found! Data structure might be different than expected."
            );
            console.log("Available keys in data:", Object.keys(data));
          }

          resolve({
            usernames: filteredUsernames,
            dataStructure: Object.keys(data).join(", "),
            totalKeys: Object.keys(data).length,
          });
        } catch (error) {
          console.error("Error parsing JSON:", error);
          reject(new Error("Invalid JSON file format: " + error.message));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  };

  const compareFollowers = async () => {
    if (!followersFile || !followingFile) {
      setError("Please upload both followers and following files");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      console.log("Starting comparison...");
      console.log("Followers file:", followersFile.name);
      console.log("Following file:", followingFile.name);

      const [followersResult, followingResult] = await Promise.all([
        parseInstagramData(followersFile),
        parseInstagramData(followingFile),
      ]);

      const followers = followersResult.usernames;
      const following = followingResult.usernames;

      console.log(`Found ${followers.length} followers`);
      console.log(`Found ${following.length} following`);

      // Set debug info
      setDebugInfo({
        followers: followers.length,
        following: following.length,
        dataStructure: `Followers: ${followersResult.dataStructure} | Following: ${followingResult.dataStructure}`,
      });

      // Find accounts you follow but who don't follow you back
      const notFollowingBack = following.filter(
        (username) => !followers.includes(username)
      );

      console.log(
        `Found ${notFollowingBack.length} accounts not following back`
      );
      setResults(notFollowingBack);

      if (notFollowingBack.length === 0 && following.length > 0) {
        setError("All accounts you follow are also following you back! 🎉");
      } else if (followers.length === 0 || following.length === 0) {
        setError(
          `Parsing issue: Found ${followers.length} followers and ${following.length} following. Check console for details.`
        );
      }
    } catch (error) {
      console.error("Error in comparison:", error);
      setError(error.message || "Error processing files");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAccountSelection = (username) => {
    setSelectedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(username)) {
        newSet.delete(username);
      } else {
        newSet.add(username);
      }
      return newSet;
    });
  };

  const resetAnalysis = () => {
    setFollowersFile(null);
    setFollowingFile(null);
    setResults([]);
    setError("");
    setDebugInfo({ followers: 0, following: 0, dataStructure: "" });
    setSelectedAccounts(new Set());
    // Reset file inputs
    document.getElementById("followers-input").value = "";
    document.getElementById("following-input").value = "";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Instagram Follower Analyzer</h1>
        <p className={styles.description}>
          Upload your Instagram followers and following data to find out who's
          not following you back.
        </p>
        <div className={styles.instructions}>
          <h3>How to get your Instagram data:</h3>
          <ol>
            <li>
              Go to Instagram Settings → Your activity → Download your
              information
            </li>
            <li>Request your data and download the ZIP file</li>
            <li>
              Extract the ZIP and find the JSON files for followers and
              following
            </li>
            <li>Upload both files here to analyze</li>
          </ol>
        </div>
      </div>

      <div className={styles.uploadSection}>
        <div className={styles.uploadCard}>
          <h3 className={styles.cardTitle}>Upload Followers Data</h3>
          <p className={styles.cardDescription}>
            Upload the JSON file containing your followers list from Instagram
            data export
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
            Upload the JSON file containing your following list from Instagram
            data export
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

        {(followersFile || followingFile || results.length > 0) && (
          <button
            onClick={resetAnalysis}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Reset
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>
              Accounts Not Following You Back ({results.length})
            </h2>
          </div>

          <div className={styles.resultsList}>
            {results.map((username, index) => {
              const isSelected = selectedAccounts.has(username);

              return (
                <div key={index} className={styles.resultItem}>
                  <div className={styles.resultContent}>
                    <div className={styles.leftSection}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAccountSelection(username)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.checkbox}
                      />
                      <span className={styles.itemNumber}>{index + 1}</span>
                    </div>
                    <a
                      href={`https://www.instagram.com/${username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.usernameLink}
                      onClick={(e) => {
                        if (e.target.closest(`.${styles.checkbox}`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <span className={styles.usernameIcon}>@</span>
                      <span className={styles.username}>{username}</span>
                      <span className={styles.externalLink}>↗</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
