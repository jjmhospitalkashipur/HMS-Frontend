import BootstrapJs from "../core/common/bootstrap-js/bootstrapjs";
import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "../../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "../../node_modules/@fortawesome/fontawesome-free/css/all.min.css";
import "../../node_modules/@tabler/icons-webfont/dist/tabler-icons.css";
import "../../src/style/css/iconsax.css";
import "../../src/style/scss/index.scss"; 
import "../../src/style/css/feather.css";
import Providers from "./Providers";

export const metadata = {
  title: "Preclinic | Medical & Hospital - Bootstrap 5 Admin Template",
  description: "Streamline your business with our advanced CRM template...",
  keywords: "Advanced CRM template, customer relationship management...",
  author: "Dreams Technologies",
  icons: {
    icon: "favicon.png",
    shortcut: "favicon.png", // Add shortcut icon for better support
    apple: "favicon.png", // Optional: for Apple devices (place in `public/`)
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          {children}
        </Providers>
        <BootstrapJs />
      </body>
    </html>
  );
}
