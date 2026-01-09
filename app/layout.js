import './globals.css'

export const metadata = {
  title: 'Halo',
  description: 'Create & share your AI memories',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  )
}
