import './globals.css'
 
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={{ backgroundColor: "#fffefc", color: "#28001e" }}>
      <body>
        {children}
        <script async defer src="https://www.recurse-scout.com/loader.js?t=9c50b48e101a6b0889830f42c474a03d"></script>
      </body>
    </html>
  )
}
