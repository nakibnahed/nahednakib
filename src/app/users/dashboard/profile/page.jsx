"use client";

import SettingsContent from "@/components/User/Layout/Content/SettingsContent";
import { useProfileShell } from "@/components/User/Layout/ProfileShellContext";

export default function SettingsPage() {
  const shell = useProfileShell();
  if (!shell?.user) {
    return null;
  }
  return <SettingsContent user={shell.user} />;
}
