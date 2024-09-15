import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface EmbeddingPoint {
  creatorId: string;
  text: string;
  embedding: [number, number, number];
}

const users: Record<string, string> = {
  "user181694388": "Amir",
  "user167908807": "Amir.d",
};

const userColors: Record<string, THREE.Color> = {
  "user181694388": new THREE.Color(0x8884d8),
  "user167908807": new THREE.Color(0x82ca9d),
};

const Point: React.FC<{ point: EmbeddingPoint; color: THREE.Color; scaleFactor: number }> = ({ point, color, scaleFactor }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(camera.quaternion);
    }
  });

  const scaledPosition = point.embedding.map(coord => coord * scaleFactor) as [number, number, number];

  return (
    <group position={scaledPosition}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <sphereGeometry args={[0.02, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.6}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
      {hovered && (
        <Html
          position={[0, 0.03, 0]}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '6px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <div>
            <p>User: {users[point.creatorId]}</p>
            <p>Text: {point.text}</p>
          </div>
        </Html>
      )}
    </group>
  );
};

const EmbeddingVisualizer: React.FC = () => {
  const [embeddings, setEmbeddings] = useState<EmbeddingPoint[]>([]);
  const [displayCount, setDisplayCount] = useState<number>(50);
  const [scaleFactor, setScaleFactor] = useState<number>(1);

  useEffect(() => {
    const fetchEmbeddings = async () => {
      try {
        const response = await fetch('/out.json');
        const data: EmbeddingPoint[] = await response.json();
        setEmbeddings(data);
      } catch (error) {
        console.error('Error fetching embeddings:', error);
      }
    };

    fetchEmbeddings();
  }, []);

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayCount(Number(event.target.value));
  };

  const handleScaleFactorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScaleFactor(Number(event.target.value));
  };

  const pointsToRender = useMemo(() => embeddings.slice(0, displayCount), [embeddings, displayCount]);

  return (
    <div className="flex flex-col items-center bg-black w-full h-screen text-white">
      <h2 className="mb-4 font-bold text-2xl">3D Telegram Embeddings Visualization</h2>

      <div className="mb-6 max-w-xs">
        <label className="block mb-2">
          Number of points:
          <input
            type="range"
            min="1"
            max={embeddings.length}
            value={displayCount}
            onChange={handleSliderChange}
            className="w-full"
          />
        </label>
        <p className="mt-2 text-center text-sm">{`Showing ${displayCount} of ${embeddings.length} points`}</p>

        <label className="block mt-4 mb-2">
          Spacing factor:
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={scaleFactor}
            onChange={handleScaleFactorChange}
            className="w-full"
          />
        </label>
        <p className="mt-2 text-center text-sm">{`Spacing factor: ${scaleFactor.toFixed(1)}`}</p>
      </div>

      <div className="w-full h-3/4">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <OrbitControls />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <spotLight position={[0, 5, 0]} angle={0.3} penumbra={1} intensity={0.8} castShadow />
          {pointsToRender.map((point, index) => (
            <Point key={index} point={point} color={userColors[point.creatorId]} scaleFactor={scaleFactor} />
          ))}
        </Canvas>
      </div>
    </div>
  );
};

export default EmbeddingVisualizer;