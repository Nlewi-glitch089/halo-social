import React from 'react'
import MaskedText from '../components/MaskedText'

export default function FeaturesPage(){
  return (
    <main>
      <section className="section-block container" style={{paddingTop:72}}>
        <h2 className="section-title"><MaskedText text="Features" size={36} weight={800} /></h2>
        <div className="features">
          <div className="card">
            <div className="card-row">
              <div className="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/></svg></div>
              <div>
                <div className="card-title"><MaskedText text="Personal AI Generation" size={16} weight={700} /></div>
                <div className="card-body">Upload once and create unlimited personalized images that feature you.</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-row">
              <div className="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/></svg></div>
              <div>
                <div className="card-title"><MaskedText text="Made for Sharing" size={16} weight={700} /></div>
                <div className="card-body">Built for connection — a clean feed designed for sharing moments.</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-row">
              <div className="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/></svg></div>
              <div>
                <div className="card-title"><MaskedText text="Instant Results" size={16} weight={700} /></div>
                <div className="card-body">Visualize locations, events, and dreams in seconds.</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-row">
              <div className="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/></svg></div>
              <div>
                <div className="card-title"><MaskedText text="Privacy First" size={16} weight={700} /></div>
                <div className="card-body">Your photos, your control. No ads, no data selling.</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-row">
              <div className="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/></svg></div>
              <div>
                <div className="card-title"><MaskedText text="Real Connections" size={16} weight={700} /></div>
                <div className="card-body">Create images that spark genuine conversations.</div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-row">
              <div className="icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M12 2l2.39 4.85L19 9l-4 3.9L16.78 18 12 15.27 7.22 18 9 12.9 5 9l4.61-2.15L12 2z" fill="rgba(255,255,255,0.95)"/></svg></div>
              <div>
                <div className="card-title"><MaskedText text="Endless Creativity" size={16} weight={700} /></div>
                <div className="card-body">Recreate memories or imagine future moments with AI.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
