import './globals.css'
import AuthHeader from './components/AuthHeader'
import { cookies as nextCookies } from 'next/headers'

export const metadata = {
  title: 'Halo',
  description: 'Create & share your AI memories',
}

export default function RootLayout({ children }) {
  // `next/headers` may export either a function or an object depending on runtime.
  const cookieStore = typeof nextCookies === 'function' ? nextCookies() : nextCookies
  let initialSignedIn = false
  try {
    if (cookieStore) {
      if (typeof cookieStore.get === 'function') {
        initialSignedIn = Boolean(cookieStore.get('halo_token')?.value)
      } else if (typeof cookieStore.getAll === 'function') {
        initialSignedIn = Boolean(cookieStore.getAll().find(c => c.name === 'halo_token')?.value)
      } else {
        initialSignedIn = Boolean(cookieStore['halo_token']?.value ?? cookieStore['halo_token'])
      }
    }
  } catch (e) {
    initialSignedIn = false
  }

  return (
    <html lang="en">
      <head />
      <body>
        <AuthHeader initialSignedIn={initialSignedIn} />

        {children}

        <footer className="site-footer">
          <div className="container">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div className="footer-logo" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#f)" />
                  <defs>
                    <linearGradient id="f" x1="0" x2="1">
                      <stop offset="0%" stopColor="var(--accent-a)" />
                      <stop offset="100%" stopColor="var(--accent-b)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="footer-meta" style={{color:'var(--muted)'}}>© {new Date().getFullYear()} — All rights reserved</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
