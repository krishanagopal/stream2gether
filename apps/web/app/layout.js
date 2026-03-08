import "./globals.css";

export const metadata = {
  title: "WatchParty - Daily Webpage",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
