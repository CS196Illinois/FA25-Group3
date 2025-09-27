import "./globals.css";
import SettingsModal from "../components/SettingsModal"

export const metadata = {
  title: "Geo-UIUC",
  description: "CS124H - FA25 Group 3's Project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
				<SettingsModal />
      </body>
    </html>
  );
}
