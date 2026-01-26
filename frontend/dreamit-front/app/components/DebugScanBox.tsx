"use client";
import RuneDecodeText from "./RuneDecodeText";

export default function DebugScanBox() {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
      height: '300px',
      background: 'linear-gradient(135deg, rgba(0, 20, 0, 0.95), rgba(0, 0, 0, 0.95))',
      border: '2px solid #00ff00',
      borderRadius: '8px',
      boxShadow: `
        0 0 20px rgba(0, 255, 0, 0.5),
        inset 0 0 20px rgba(0, 255, 0, 0.1)
      `,
      padding: '20px',
      fontFamily: 'monospace',
      color: '#00ff00',
      zIndex: 9999,
      animation: 'boxMaterialize 1.5s ease-out forwards',
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(0.8)',
    }}>
      <style jsx>{`
        @keyframes boxMaterialize {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
            box-shadow: 0 0 0 rgba(0, 255, 0, 0);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.05);
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.7);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(0, 255, 0, 0.1);
          }
        }
        @keyframes scanLine {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes signalPulse {
          0%, 100% { width: 75%; opacity: 1; }
          50% { width: 85%; opacity: 0.8; }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '10px',
        right: '10px',
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ff00, transparent)',
        animation: 'scanLine 2s infinite',
      }} />
      <h3 style={{
        margin: '0 0 10px 0',
        fontSize: '16px',
        color: '#00ff00',
        textShadow: '0 0 10px #00ff00',
        letterSpacing: '1px'
      }}>
        SCAN COMPLETE
      </h3>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#ffffff' }}>
        <RuneDecodeText text="DragonLog" duration={1200} delay={1800} />
      </h4>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#00ff00' }}>
        <RuneDecodeText text="🏢 Enterprise Platform" duration={1200} delay={1800} />
      </p>
      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#ffffff' }}>
        <RuneDecodeText text="TECH STACK:" duration={1200} delay={1800} />
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #00ff00',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="https://cdn.simpleicons.org/nextdotjs/000000" alt="Next.js" style={{
            width: '20px',
            height: '20px',
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))'
          }} />
        </div>
        <div style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #00ff00',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="https://cdn.simpleicons.org/rust/000000" alt="Rust" style={{
            width: '20px',
            height: '20px',
            filter: 'drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))'
          }} />
        </div>
        <div style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #00ff00',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="https://cdn.simpleicons.org/postgresql/4169E1" alt="PostgreSQL" style={{
            width: '20px',
            height: '20px'
          }} />
        </div>
        <div style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #00ff00',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="https://cdn.simpleicons.org/hetzner/D50C2D" alt="Hetzner" style={{
            width: '20px',
            height: '20px'
          }} />
        </div>
        <div style={{
          width: '28px',
          height: '28px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid #00ff00',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="https://cdn.simpleicons.org/docker/2496ED" alt="Docker" style={{
            width: '20px',
            height: '20px'
          }} />
        </div>
      </div>
      <p style={{ margin: '8px 0 8px 0', fontSize: '14px', color: '#00ff00' }}>
        <RuneDecodeText text="⚡ Active Development" duration={1200} delay={1800} />
      </p>
      <p style={{ margin: '0', fontSize: '14px', color: '#ffffff' }}>
        <RuneDecodeText text="👥 B2C Consumers" duration={1200} delay={1800} />
      </p>
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#00ff00', marginBottom: '5px' }}>
          <RuneDecodeText text="SIGNAL STRENGTH" duration={1200} delay={1800} />
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '75%',
            height: '100%',
            background: 'linear-gradient(90deg, #00ff00, #00ffff)',
            borderRadius: '2px',
            animation: 'signalPulse 3s ease-in-out infinite'
          }} />
        </div>
      </div>
    </div>
  );
}