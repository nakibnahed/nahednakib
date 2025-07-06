"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import UserLayout from "@/components/User/Layout/UserLayout";
import styles from "../Profile.module.css";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    avatar_url: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Could not load profile data");
        } else {
          setProfileData(profile);
          setFormData({
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            avatar_url: profile?.avatar_url || "",
          });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("An error occurred while loading your data");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        setError("Failed to update profile");
      } else {
        setSuccess("Profile updated successfully!");
        setProfileData((prev) => ({ ...prev, ...formData }));
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("An error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#fff",
        }}
      >
        <p>Loading settings...</p>
      </div>
    );
  }

  if (error && !formData.first_name) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#ff6b6b",
        }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <UserLayout user={user} profileData={profileData}>
      <div className={styles.profileContent}>
        <div className={styles.contentHeader}>
          <h1>Settings</h1>
          <p>Manage your account settings</p>
        </div>

        <div className={styles.settingsForm}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Email</label>
              <div className={styles.readOnlyField}>
                {user?.email || "No email available"}
              </div>
              <small className={styles.fieldNote}>
                Email cannot be changed here
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="avatar_url">Avatar URL</label>
              <input
                type="url"
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                className={styles.formInput}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </UserLayout>
  );
}
