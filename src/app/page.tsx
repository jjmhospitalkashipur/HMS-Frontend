"use client";

import DashboardComponent from "@/components/pages/dashboard/dashboard/dashboard";
import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";

export default function HomePage() {
  return (
    <div className="main-wrapper">
      <Header />
      <Sidebar />
      <DashboardComponent />
    </div>
  );
}

