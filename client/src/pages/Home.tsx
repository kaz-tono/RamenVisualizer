import { useState } from "react";
import Scene from "@/components/Scene";
import Controls from "@/components/Controls";
import FileUpload from "@/components/FileUpload";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [pointCloudData, setPointCloudData] = useState<Float32Array | null>(null);
  const [settings, setSettings] = useState({
    pointSize: 0.02,
    steamIntensity: 0.5,
    steamSpeed: 1.0,
    steamDensity: 100,
    autoRotate: true
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          3D Ramen Visualizer
        </h1>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="lg:w-3/4 relative">
          <Card className="w-full h-[600px] lg:h-full">
            <Scene
              pointCloudData={pointCloudData}
              settings={settings}
            />
          </Card>
        </div>

        <div className="lg:w-1/4 space-y-4">
          <FileUpload onDataLoaded={setPointCloudData} />
          <Controls settings={settings} onSettingsChange={setSettings} />
        </div>
      </main>
    </div>
  );
}
