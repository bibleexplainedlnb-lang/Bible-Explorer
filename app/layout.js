export const metadata = {
  title: "Bible Explorer",
  description: "Explore the Bible",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
