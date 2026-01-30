import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, Center, Bounds } from '@react-three/drei'

function Model({ url }) {
    const { scene } = useGLTF(url)
    return <primitive object={scene} />
}

export default function Model3DViewer({ glbUrl, height = '300px' }) {
    return (
        <div style={{ width: '100%', maxWidth: '100%', height, background: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>
            <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <Suspense fallback={null}>
                    <Bounds fit clip observe margin={1.2}>
                        <Center>
                            <Model url={glbUrl} />
                        </Center>
                    </Bounds>
                    <Environment preset="city" />
                </Suspense>
                <OrbitControls
                    makeDefault
                    autoRotate
                    autoRotateSpeed={2}
                    enablePan={false}
                    minDistance={0.5}
                    maxDistance={5}
                    enableDamping={false}
                />
            </Canvas>
        </div>
    )
}
