import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-wrapper">
      {/* Header commented out - profile shown in sidebar bottom */}
      {/* <Header /> */}
      <Sidebar />
      {children}
    </div>
  );
}
