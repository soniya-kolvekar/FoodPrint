import React from 'react';

interface OrbitProps {
  images: string[];
  radius?: number;
  duration?: number;
  iconSize?: number;
}

export default function Orbit({
  images,
  radius = 350, // Much wider radius
  duration = 20,
  iconSize = 64
}: OrbitProps) {
  return (
    <div className="relative flex items-center justify-center my-24 pointer-events-none perspective-[1200px]" style={{ width: radius * 2, height: radius * 2 }}>
      {/* Central glow/orb */}
      <div className="absolute w-24 h-24 bg-gradient-to-tr from-[#da627d] to-[#f9dbbd] rounded-full blur-[20px] opacity-30 z-0"></div>
      
      {/* Slanted Wrapper to tilt the entire orbit diagonally */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "rotateZ(-15deg)", transformStyle: "preserve-3d" }}>
        
        {/* The 3D spinning container (the orbital plane) */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(75deg)",
            animation: `spin3D ${duration}s linear infinite`
          }}
        >
          <style>{`
            @keyframes spin3D {
              0% { transform: rotateX(75deg) rotateZ(0deg); }
              100% { transform: rotateX(75deg) rotateZ(-360deg); } /* Anticlockwise */
            }
          `}</style>
          
          {/* Dashed circular track inside the 3D plane */}
          <div 
            className="absolute rounded-full border-[1.5px] border-dashed border-[#1d070c]/50"
            style={{ width: radius * 2, height: radius * 2 }}
          ></div>

          {images.map((img, i) => {
            const angle = (i / images.length) * 360;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  transform: `rotateZ(${angle}deg) translateX(${radius}px)`,
                  transformStyle: "preserve-3d"
                }}
              >
                <style>{`
                  @keyframes counterSpin3D_${i} {
                    /* Counteract dynamic spin, static angle, 3D squash, AND the diagonal slant */
                    0% { transform: rotateZ(${-angle}deg) rotateX(-75deg) rotateZ(15deg); }
                    100% { transform: rotateZ(${360 - angle}deg) rotateX(-75deg) rotateZ(15deg); } 
                  }
                `}</style>
                <div 
                  style={{ animation: `counterSpin3D_${i} ${duration}s linear infinite` }}
                >
                  <div 
                    className="rounded-[12px] border-[3px] border-[#fffbfa] shadow-[0_15px_35px_rgba(69,9,32,0.2)] overflow-hidden bg-white flex items-center justify-center relative group pointer-events-auto"
                    style={{ width: iconSize, height: iconSize }}
                  >
                    <img src={img} alt={`Orbit Item ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
