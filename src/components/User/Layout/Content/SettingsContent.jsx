"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "../../../../app/users/profile/Profile.module.css";
import Image from "next/image";
import { Upload, X, User } from "lucide-react";

export default function SettingsContent({ user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    avatar_url: "",
    bio: "",
    professional_role: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);

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
            bio: profile?.bio || "",
            professional_role: profile?.professional_role || "",
          });
          setPreviewUrl(profile?.avatar_url || "");
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError("An error occurred while loading your profile data");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadProfileData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setError("");

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(formData.avatar_url || "");
    setError("");
  };

  const uploadImage = async (file) => {
    try {
      setUploading(true);

      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (direct to bucket root)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      let avatarUrl = formData.avatar_url;

      // Upload new image if selected
      if (selectedFile) {
        avatarUrl = await uploadImage(selectedFile);
      }

      // Update profile data
      const updateData = {
        ...formData,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        setError("Failed to update profile");
      } else {
        setSuccess("Profile updated successfully!");
        setProfileData((prev) => ({ ...prev, ...updateData }));
        setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "An error occurred while updating your profile");
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
    <div className={styles.profileContent}>
      <div className={styles.contentHeader}>
        <h1>Profile Settings</h1>
        <p>Manage your account settings and profile information</p>
      </div>

      <div className={styles.settingsForm}>
        <form onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <div className={styles.formGroup}>
            <label>Profile Picture</label>
            <div className={styles.avatarSection}>
              <div className={styles.avatarPreview}>
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile"
                    width={100}
                    height={100}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <User size={40} />
                  </div>
                )}
              </div>

              <div className={styles.avatarControls}>
                <label htmlFor="avatar-upload" className={styles.uploadButton}>
                  <Upload size={16} />
                  {selectedFile ? "Change Image" : "Upload Image"}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                {selectedFile && (
                  <button
                    type="button"
                    onClick={removeSelectedFile}
                    className={styles.removeButton}
                  >
                    <X size={16} />
                    Remove
                  </button>
                )}

                {selectedFile && (
                  <p className={styles.fileInfo}>
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

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
              placeholder="Enter your first name"
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
              placeholder="Enter your last name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="professional_role">Professional Role</label>
            <input
              type="text"
              id="professional_role"
              name="professional_role"
              value={formData.professional_role}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="e.g., Web Developer, Designer, Writer..."
              maxLength={100}
            />
            <small className={styles.fieldNote}>
              This will appear under your name on blog posts and profile pages
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className={styles.formTextarea}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
            />
            <small className={styles.fieldNote}>
              {formData.bio.length}/500 characters
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="avatar_url">Avatar URL (Alternative)</label>
            <input
              type="url"
              id="avatar_url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="Or enter an image URL"
            />
            <small className={styles.fieldNote}>
              Use this if you prefer to link to an external image
            </small>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button
            type="submit"
            disabled={saving || uploading}
            className={styles.saveButton}
          >
            {saving || uploading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
