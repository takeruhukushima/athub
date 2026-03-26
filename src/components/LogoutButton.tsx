
"use client";

import { logout } from "@/lib/auth/session";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-stone-500 hover:text-stone-800"
    >
      Sign out
    </button>
  );
}
