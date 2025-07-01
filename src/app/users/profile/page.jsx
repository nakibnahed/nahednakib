"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./Profile.module.css";

export default function ProfileDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [likedPosts, setLikedPosts] = useState([]);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setMessage("Not logged in");
        setLoading(false);
        return;
      }
      setEmail(user.email);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setMessage("Could not load profile");
      } else if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      }

      // Fetch liked posts
      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("post_id, posts(title)")
        .eq("user_id", user.id);

      if (!likesError && likes) {
        setLikedPosts(likes);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Not logged in");
      setSaving(false);
      return;
    }
    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        bio,
      })
      .eq("id", user.id);

    if (error) {
      setMessage("Failed to update profile");
    } else {
      setMessage("Profile updated!");
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    setMessage("Account deletion is not implemented in this demo.");
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    setMessage("");
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Not logged in");
      setAvatarUploading(false);
      return;
    }
    // Upload avatar to storage
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage("Failed to upload avatar");
      setAvatarUploading(false);
      return;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update profile with avatar URL
    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setAvatarUrl(publicUrl);
    setAvatarUploading(false);
    setMessage("Avatar updated!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Redirect to home or login page after logout
  };

  if (loading)
    return (
      <div className={styles.container}>
        <p>Loading dashboard...</p>
      </div>
    );

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt="Avatar"
          className={styles.avatar}
        />
        <button
          type="button"
          className={styles.avatarButton}
          onClick={() => fileInputRef.current.click()}
          disabled={avatarUploading}
          title="Change avatar"
        >
          {avatarUploading ? "Uploading..." : "Change Avatar"}
        </button>
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleAvatarChange}
          disabled={avatarUploading}
        />
        <h3 style={{ margin: "16px 0 0 0" }}>User Panel</h3>
        <ul className={styles.menu}>
          <li
            className={`${styles.menuItem} ${
              activeTab === "profile" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </li>
          <li
            className={`${styles.menuItem} ${
              activeTab === "likes" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("likes")}
          >
            Liked Posts
          </li>
        </ul>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleLogout}
          style={{ marginTop: 32 }}
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {activeTab === "profile" && (
          <section>
            <h1 style={{ fontSize: 28, marginBottom: 24, color: "#fff" }}>
              Profile
            </h1>
            <form onSubmit={handleSave} className={styles.form}>
              <label style={{ color: "#ccc", textAlign: "left" }}>
                First Name
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saving}
              />
              <label style={{ color: "#ccc", textAlign: "left" }}>
                Last Name
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saving}
              />
              <label style={{ color: "#ccc", textAlign: "left" }}>Bio</label>
              <textarea
                className={styles.input}
                placeholder="Short bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={saving}
                rows={3}
              />
              <label style={{ color: "#ccc", textAlign: "left" }}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                disabled
                style={{ background: "#222", color: "#aaa" }}
              />
              <button className={styles.button} type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
            <button
              type="button"
              className={`${styles.button} ${styles.deleteButton}`}
              onClick={handleDeleteAccount}
              disabled={saving}
            >
              Delete Account
            </button>
            {message && <p className={styles.message}>{message}</p>}
          </section>
        )}

        {activeTab === "likes" && (
          <section>
            <h1 style={{ fontSize: 28, marginBottom: 24, color: "#fff" }}>
              Liked Posts
            </h1>
            {likedPosts.length === 0 && (
              <p style={{ color: "#aaa" }}>You haven't liked any posts yet.</p>
            )}
            <ul className={styles.likedList}>
              {likedPosts.map((like, i) => (
                <li key={i} className={styles.likedItem}>
                  <a
                    href={`/blog/${like.post_id}`}
                    className={styles.likedLink}
                  >
                    {like.posts?.title || "Untitled Post"}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
