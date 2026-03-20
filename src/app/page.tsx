"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { all_routes } from "@/routes/all_routes";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userString = localStorage.getItem("authUser");

    if (!authToken) {
      router.replace(all_routes.login);
      return;
    }

    let role = "";
    try {
      const user = userString ? JSON.parse(userString) : null;
      role = user?.role?.toUpperCase?.() ?? "";
    } catch {
      role = "";
    }

    if (role === "RECEPTIONIST") {
      router.replace(all_routes.appointments);
      return;
    }

    router.replace(all_routes.dashboard);
  }, [router]);

  return (
    <div className="d-flex align-items-center justify-content-center vh-100">
      <span className="text-muted">Loading...</span>
    </div>
  );
}

