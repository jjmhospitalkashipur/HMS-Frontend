import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";
import ThemeSettings from "@/core/common/theme-settings";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-wrapper">
      <Header />
      <Sidebar />
      <ThemeSettings />
      {children}
    </div>
  );
}
