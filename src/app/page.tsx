"use client";

import DashboardComponent from "@/components/pages/dashboard/dashboard/dashboard";
import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";
import ThemeSettings from "@/core/common/theme-settings";

export default function HomePage() {
  return (
    <div className="main-wrapper">
      <Header />
      <Sidebar />
      <ThemeSettings />
      <DashboardComponent />
    </div>
  );
}

