"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";

interface OrbProps {
  hoverIntensity?: number;
  rotateSpeed?: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
}

export const Orb: React.FC<OrbProps> = ({
  hoverIntensity = 0.5,
  rotateSpeed = 1,
  hue = 0.95, // Pinkish
  saturation = 0.7,
  brightness = 1.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // SMALL FOCUSED ORB: Radius reduced for a cleaner background look
    const geometry = new THREE.IcosahedronGeometry(2.5, 40); 
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHue: { value: hue },
        uSaturation: { value: saturation },
        uBrightness: { value: brightness },
        uHover: { value: 0 },
        uClick: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform float uHover;
        uniform float uClick;

        // Simplex 3D Noise 
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        float snoise(vec3 v){ 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + 1.0/6.0;
          vec3 x2 = x0 - i2 + 1.0/3.0;
          vec3 x3 = x0 - D.yyy;
          i = mod(i, 289.0); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 1.0/7.0;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          
          vec3 newPos = position;
          float noise = snoise(vec3(newPos.x * 0.5 + uTime * 0.2, newPos.y * 0.5 + uTime * 0.25, newPos.z * 0.5));
          
          // Click deformation
          float clickDeform = snoise(vec3(newPos * 0.8 + uTime)) * uClick * 3.5;
          
          newPos += normal * (noise * (0.6 + uHover * 1.0) + clickDeform);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform float uHue;
        uniform float uSaturation;
        uniform float uBrightness;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          float intensity = pow(0.85 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
          
          // Theme colors: Bordeaux Navbar Theme
          vec3 color1 = hsv2rgb(vec3(uHue, uSaturation, uBrightness)); // Bordeaux
          vec3 color2 = hsv2rgb(vec3(uHue + 0.05, uSaturation - 0.2, uBrightness + 0.3)); // Apricot hint
          
          vec3 finalColor = mix(color1, color2, vNormal.y * 0.5 + 0.5);
          
          gl_FragColor = vec4(finalColor, intensity * 0.4);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 6; // Closer camera for smaller orb to feel "fit"

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let clickValue = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * -2;
    };

    const handleClick = () => {
      clickValue = 1.2;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleClick);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      requestAnimationFrame(animate);

      const time = performance.now() * 0.001;
      material.uniforms.uTime.value = time;

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      
      // Decay click deformation
      clickValue *= 0.94;
      material.uniforms.uClick.value = clickValue;

      mesh.rotation.y = time * 0.1 * rotateSpeed + targetX * hoverIntensity;
      mesh.rotation.x = time * 0.05 * rotateSpeed + targetY * hoverIntensity;
      
      material.uniforms.uHover.value = Math.sqrt(targetX * targetX + targetY * targetY);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [hoverIntensity, rotateSpeed, hue, saturation, brightness]);

  return <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

export default Orb;
