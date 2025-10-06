import "./globals.css";
import SettingsModal from "../components/SettingsModal"
export const metadata = {
  title: "Geo-UIUC",
  description: "CS124H - FA25 Group 3's Project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <main>{children}</main>
        {/* <SettingsModal /> */}
        {/* <br></br> */}

      </body>
    </html>
  );
}
