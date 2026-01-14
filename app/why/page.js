import React from 'react'
import MaskedText from '../components/MaskedText'

export default function WhyPage(){
  return (
    <main>
      <section className="section-block container" style={{paddingTop:72}}>
        <h2 className="section-title"><MaskedText text="Why Halo is Different" size={36} weight={800} /></h2>
        <p className="sub" style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 32px' }}>Unlike generic AI art generators or traditional social media, Halo creates personalized images featuring you and your loved ones.</p>

        <div id="comparison" style={{marginTop:20}} className="fade-up">
          <h3 style={{textAlign:'center', marginBottom:12}}>Not Your Average Social App</h3>
          <div className="comparison">
            <div className="compare-card">
              <h4><MaskedText text="Traditional Social Media" size={18} weight={700} /></h4>
              <ul className="compare-list">
                <li><span className="cross" /> Endless ads and sponsored content</li>
                <li><span className="cross" /> Algorithm-driven feed chaos</li>
                <li><span className="cross" /> Your data sold to advertisers</li>
                <li><span className="cross" /> Pressure for perfect photos</li>
              </ul>
            </div>
            <div className="compare-card">
              <h4><MaskedText text="Generic AI Generators" size={18} weight={700} /></h4>
              <ul className="compare-list">
                <li><span className="cross" /> Random faces, not yours</li>
                <li><span className="cross" /> No social sharing features</li>
                <li><span className="cross" /> Complex prompts required</li>
                <li><span className="cross" /> Isolated experience</li>
              </ul>
            </div>
            <div className="compare-card">
              <h4><MaskedText text="Halo" size={18} weight={700} /></h4>
              <ul className="compare-list">
                <li><span className="check" /> 100% ad-free experience</li>
                <li><span className="check" /> Personalized AI with YOUR face</li>
                <li><span className="check" /> Privacy-first, no data selling</li>
                <li><span className="check" /> Built for sharing & connection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
