"use client";

import { useState } from "react";
import UserSidebar from "@/components/User/Sidebar/UserSidebar";
import UserDashboard from "@/components/User/Dashboard/UserDashboard";
import styles from "./UserLayout.module.css";

// Simplified content components
import CommentsContent from "./Content/CommentsContent";
import LikesContent from "./Content/LikesContent";
import FavoritesContent from "./Content/FavoritesContent";
import SettingsContent from "./Content/SettingsContent";

export default function UserLayout({ user, profileData }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <UserDashboard
            user={user}
            profileData={profileData}
            setActiveTab={setActiveTab}
          />
        );
      case "comments":
        return <CommentsContent user={user} />;
      case "likes":
        return <LikesContent user={user} />;
      case "favorites":
        return <FavoritesContent user={user} />;
      case "settings":
        return <SettingsContent user={user} />;
      default:
        return (
          <UserDashboard
            user={user}
            profileData={profileData}
            setActiveTab={setActiveTab}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      <UserSidebar
        user={user}
        profileData={profileData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <main className={styles.content}>{renderContent()}</main>
    </div>
  );
}
