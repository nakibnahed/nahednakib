"use client";

import UserDashboard from "@/components/User/Dashboard/UserDashboard";
import { useProfileShell } from "@/components/User/Layout/ProfileShellContext";

export default function ProfilePage() {
  const shell = useProfileShell();
  if (!shell?.user || !shell?.profileData) {
    return null;
  }
  return <UserDashboard user={shell.user} profileData={shell.profileData} />;
}
