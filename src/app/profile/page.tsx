"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /profile to /settings for backward compatibility
    router.replace('/settings');
  }, [router]);

  return null;
}
