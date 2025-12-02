import "./globals.css";
import SettingsModal from "../components/SettingsModal"
import Particles from "@/components/Particles";
// AudioProvider wraps the whole app so any page/component can access audio controls.
// How it works: it provides a React Context with helpers (startMusic, playEffect,
// set volumes). Wrapping at the root ensures there is a single AudioContext and
// that volume/mute state is shared across pages.
import AudioProvider from "../components/AudioProvider";
import GlobalButtonSfx from "../components/GlobalButtonSfx";
export const metadata = {
  title: "Play GeoUIUC!",
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
        {/* Wrap the entire app with AudioProvider so Settings and Game can control sound */}
        <AudioProvider>
          <main>{children}</main>
          {/* Global UI helpers */}
          <GlobalButtonSfx />
          {/* Global settings button/modal on all pages */}
          <Particles></Particles>
          <SettingsModal />
        </AudioProvider>
      </body>
    </html>
  );
}
