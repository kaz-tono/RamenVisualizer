import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlsProps {
  settings: {
    steamIntensity: number;
    steamSpeed: number;
    steamDensity: number;
    autoRotate: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export default function Controls({ settings, onSettingsChange }: ControlsProps) {
  const updateSetting = (key: string, value: number | boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="space-y-2">
          <Label>Steam Intensity</Label>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[settings.steamIntensity]}
            onValueChange={([value]) => updateSetting('steamIntensity', value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Steam Speed</Label>
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={[settings.steamSpeed]}
            onValueChange={([value]) => updateSetting('steamSpeed', value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Auto Rotate</Label>
          <Switch
            checked={settings.autoRotate}
            onCheckedChange={(checked) => updateSetting('autoRotate', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
