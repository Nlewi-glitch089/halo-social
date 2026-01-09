"use client"
import React from 'react'

const vars = {
  bg: 'linear-gradient(180deg, #0b0710 0%, #1b0f26 40%, #0d1b1a 100%)',
  heroGradient: 'linear-gradient(90deg,#ff6ec7 0%,#9b7cff 40%,#56f1d3 100%)',
  cardGradient: 'linear-gradient(135deg,#6f2bdc 0%,#ff6ec7 50%,#ff9a63 100%)',
  accent: '#ff6ec7',
  muted: '#9aa1b2',
}

function Section({ children, style }) {
  return <section style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto', ...style }}>{children}</section>
}

export default function Page() {
  return (
    <main style={{ minHeight: '100vh', background: vars.bg, color: '#e9eef6', fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
      <Section style={{ paddingTop: 96, textAlign: 'center' }}>
        <h1 style={{ fontSize: 56, lineHeight: 1.02, margin: 0, fontWeight: 800 }}>
          <span style={{ display: 'block' }}>Create & Share</span>
          <span style={{ display: 'block', background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Your AI Memories</span>
        </h1>
        <p style={{ maxWidth: 780, margin: '20px auto 12px', color: '#bfc9d9', fontSize: 18 }}>
          Generate stunning, personalized images of yourself with friends, family, and dream experiences using AI. Share authentic moments that spark real connections.
        </p>
        <p style={{ color: '#7f8aa1', marginTop: 8 }}>No credit card required • Free to start</p>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 12, background: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.12))`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: `radial-gradient(circle at 30% 20%, rgba(255,110,199,0.12), transparent 30%), linear-gradient(135deg,#6f2bdc40,#ff6ec740)` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section style={{ borderTop: '1px solid rgba(255,255,255,0.02)', background: 'transparent' }}>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', gap: 12, justifyContent: 'space-around' }}>
            <Stat value="10K+" label="AI Images Created" />
            <Stat value="5K+" label="Active Users" />
            <Stat value="99%" label="Satisfaction Rate" />
            <Stat value="100%" label="Free Forever" />
          </div>
        </div>
      </Section>

      <Section>
        <h2 style={{ textAlign: 'center', fontSize: 36, marginBottom: 18 }}><span>Why </span><span style={{ background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Halo</span> is Different</h2>
        <p style={{ textAlign: 'center', color: '#b9c3d8', maxWidth: 820, margin: '0 auto 32px' }}>Unlike generic AI art generators or traditional social media, Halo creates personalized images featuring you and your loved ones.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
          <FeatureCard title="Personal AI Generation" body="Upload your photo once, then create unlimited personalized images. No more generic AI art—these images feature YOU." iconColor="#d47eff" />
          <FeatureCard title="Made for Sharing" body="Built for connection. Share your AI-generated memories with friends and family in a beautiful, distraction-free feed." iconColor="#ff8a6a" />
          <FeatureCard title="Instant Results" body="See yourself on a tropical beach, at the Eiffel Tower, or in your dream wedding in seconds." iconColor="#4ee1f0" />
          <FeatureCard title="Privacy First" body="Your photos, your control. No ads, no data selling, no creepy tracking." iconColor="#8f7bff" />
          <FeatureCard title="Real Connections" body="Move beyond perfect poses and filters. Create moments that spark genuine conversations and laughter." iconColor="#ff6ec7" />
          <FeatureCard title="Endless Creativity" body="From recreating childhood memories to visualizing future dreams, explore infinite possibilities with AI." iconColor="#2ee59b" />
        </div>
      </Section>

      <Section style={{ textAlign: 'center', paddingTop: 32 }}>
        <h2 style={{ fontSize: 36, marginBottom: 8 }}>Get Started in <span style={{ background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>3 Simple Steps</span></h2>
        <p style={{ color: '#b9c3d8' }}>No technical skills required. Anyone can create stunning AI memories.</p>

        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28 }}>
          <Step number={1} title="Upload Your Photo" body="Share a photo of yourself or your loved ones. Our AI learns your features to create personalized generations." />
          <Step number={2} title="Describe Your Vision" body="Type what you want to see — be creative!" />
          <Step number={3} title="Share & Connect" body="Post your AI creation to your feed. Watch friends react, comment, and create their own memories." />
        </div>
      </Section>

      <Section style={{ textAlign: 'center', paddingBottom: 96 }}>
        <h2 style={{ fontSize: 44, marginBottom: 12 }}>Ready to Create Your First <span style={{ background: vars.heroGradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>AI Memory?</span></h2>
        <p style={{ color: '#b9c3d8', marginBottom: 28 }}>Join thousands of creators sharing personalized AI moments with the people they love. Start for free, no credit card required.</p>
        <button style={{ padding: '14px 28px', fontSize: 18, borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#ff6ec7,#ff9a63)', color: '#fff', cursor: 'pointer' }}>Create Your Free Account →</button>
      </Section>
    </main>
  )
}

function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg,#ff6ec7,#9b7cff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{value}</div>
      <div style={{ color: '#9fb0d0', fontSize: 13 }}>{label}</div>
    </div>
  )
}

function FeatureCard({ title, body, iconColor = '#ff6ec7' }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', boxShadow: '0 6px 30px rgba(3,6,15,0.6)', minHeight: 140 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: `linear-gradient(135deg, ${iconColor}, rgba(255,255,255,0.06))` }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ color: '#9fb0d0', marginTop: 8 }}>{body}</div>
        </div>
      </div>
    </div>
  )
}

function Step({ number, title, body }) {
  return (
    <div style={{ width: 260, padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(90deg,#ff6ec7,#ff9a63)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20 }}>{number}</div>
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          <div style={{ color: '#9fb0d0', marginTop: 6 }}>{body}</div>
        </div>
      </div>
    </div>
  )
}
