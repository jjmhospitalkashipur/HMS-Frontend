"use client";

import Header from "@/core/common/header/header";
import Sidebar from "@/core/common/sidebar/sidebar";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ThemeLayouts({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Get the current pathname

    useEffect(() => {
        const htmlElement = document.documentElement;

        // Log for debugging
        // console.log("Current Pathname:", pathname);

        // Reset classes before applying new ones
        document.body.classList.remove(
            "mini-sidebar",
            "expand-menu",
        );

        // Only allow data-layout and data-width in this segment
        const attrsToClear = [
            "data-sidebar",
            "data-theme",
            "data-topbar",
            "data-topbarcolor",
            "data-color",
        ];
        attrsToClear.forEach((attr) => htmlElement.removeAttribute(attr));
        // Clear body data-* attributes set by global theme
        document.body.removeAttribute("data-sidebarbg");
        document.body.removeAttribute("data-topbarbg");

        switch (pathname) {
            case "/layout-mini":
                htmlElement.setAttribute("data-layout", "mini");
                document.body.classList.add("mini-sidebar");
                break;

            case "/layout-hover-view":
                htmlElement.setAttribute("data-layout", "hoverview");
                break;

            case "/layout-hidden":
                htmlElement.setAttribute("data-layout", "hidden");
                break;

            case "/layout-full-width":
                htmlElement.setAttribute("data-layout", "full-width");
                break;
            case "/layout-dark":
                htmlElement.setAttribute("data-bs-theme", "dark");
                break;

            // case "/layout-rtl":
            //     htmlElement.setAttribute("dir", "rtl");
            //     break;
                
            default:
                htmlElement.setAttribute("data-layout", "default");
                break;
        }
    }, [pathname]);
    
  return (
    <div className="main-wrapper">
      <Header />
      <Sidebar />
      {children}
    </div>
  );
}
