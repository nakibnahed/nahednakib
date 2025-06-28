"use client";
import { useEffect, useState, useRef } from "react";
import styles from "../../login/Login.module.css";

export default function ProfileDashboard() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchProfile() {
      const { supabase } = await import("@/services/supabaseClient");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setEmail(user.email);

      // Fetch profile from 'profiles' table
      let { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url, bio")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            first_name: "",
            last_name: "",
            avatar_url: "",
            bio: "",
          },
        ]);
        profileData = {
          first_name: "",
          last_name: "",
          avatar_url: "",
          bio: "",
        };
      }

      setFirstName(profileData.first_name || "");
      setLastName(profileData.last_name || "");
      setAvatarUrl(profileData.avatar_url || "");
      setBio(profileData.bio || "");

      // Fetch liked posts
      const { data: likes } = await supabase
        .from("likes")
        .select("post_id, posts(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setLikedPosts(likes || []);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const { supabase } = await import("@/services/supabaseClient");
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        bio,
      })
      .eq("email", email);
    if (error) setMessage("Error saving profile.");
    else setMessage("Profile updated!");
    setSaving(false);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    setMessage("");
    const { supabase } = await import("@/services/supabaseClient");
    const fileExt = file.name.split(".").pop();
    const filePath = `${email}/avatar.${fileExt}`;
    let { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      setMessage("Avatar upload failed.");
      setAvatarUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setMessage("Avatar updated!");
    setAvatarUploading(false);
  }

  // --- Delete Account Logic ---
  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This cannot be undone."
      )
    )
      return;
    setSaving(true);
    const { supabase } = await import("@/services/supabaseClient");

    // Delete from profiles table
    await supabase.from("profiles").delete().eq("email", email);

    // Note: Deleting from auth.users requires admin privileges (service role key).
    // For security, this should be done via a serverless function or backend API.
    setMessage(
      "Profile deleted. Please contact support to fully remove your account."
    );
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  }

  // --- Log Out Logic ---
  async function handleLogout() {
    const { supabase } = await import("@/services/supabaseClient");
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading)
    return (
      <div className={styles.container}>
        <p>Loading dashboard...</p>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        minHeight: "80vh",
        background: "var(--background-main, #181818)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: "#222",
          color: "#fff",
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
        }}
      >
        <img
          src={avatarUrl || "/default-avatar.png"}
          alt="Avatar"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #ee681a",
            background: "#222",
            marginBottom: 16,
          }}
        />
        <button
          type="button"
          style={{
            background: "#ee681a",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontWeight: "bold",
            padding: "6px 12px",
            marginBottom: 24,
            cursor: "pointer",
          }}
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
        <div style={{ width: "100%" }}>
          <button
            onClick={() => setActiveTab("profile")}
            style={{
              width: "100%",
              background: activeTab === "profile" ? "#ee681a" : "transparent",
              color: activeTab === "profile" ? "#222" : "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              marginBottom: 8,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            style={{
              width: "100%",
              background: activeTab === "likes" ? "#ee681a" : "transparent",
              color: activeTab === "likes" ? "#222" : "#fff",
              border: "none",
              borderRadius: 6,
              padding: "10px 0",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Liked Posts
          </button>
        </div>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          Log Out
        </button>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "40px 32px",
          background: "var(--background-main, #181818)",
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          minHeight: "80vh",
        }}
      >
        {activeTab === "profile" && (
          <section>
            <h1 style={{ fontSize: 28, marginBottom: 24, color: "#fff" }}>
              Profile
            </h1>
            <form
              onSubmit={handleSave}
              className={styles.form}
              style={{ maxWidth: 400 }}
            >
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
              className={styles.button}
              style={{ background: "#c00", marginTop: 24 }}
              onClick={handleDeleteAccount}
              disabled={saving}
            >
              Delete Account
            </button>
            {message && (
              <p style={{ color: "#ee681a", marginTop: 8 }}>{message}</p>
            )}
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
            <ul style={{ padding: 0, listStyle: "none" }}>
              {likedPosts.map((like, i) => (
                <li
                  key={i}
                  style={{
                    marginBottom: 12,
                    background: "#232323",
                    borderRadius: 6,
                    padding: "12px 16px",
                  }}
                >
                  <a
                    href={`/blog/${like.post_id}`}
                    style={{
                      color: "#ee681a",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: 18,
                    }}
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
