import { motion } from 'framer-motion';
import { Layers, Crosshair, Plus, Flame, Navigation } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { cn } from '../../utils/cn';

function ControlButton({ icon: Icon, label, active, onClick, className, isSatellite }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={label}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200',
        isSatellite 
          ? 'bg-black/50 backdrop-blur-md border border-white/20 shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:bg-black/70 hover:border-white/40 text-white'
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
        active && 'bg-primary/20 border-primary/50 text-primary shadow-glow-blue',
        !active && !isSatellite && 'text-white/70 hover:text-white',
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
}

export default function MapControls() {
  const { showHeatmap, toggleHeatmap, showSatellite, toggleSatellite, setReportPanelOpen, setRoutingPanelOpen, routingPanelOpen } = useAppStore();
  const { locate, loading } = useGeolocation();

  return (
    <div className="absolute left-4 bottom-24 z-20 flex flex-col gap-2 pointer-events-auto">
      <ControlButton
        icon={Plus}
        label="Report Incident"
        onClick={() => setReportPanelOpen(true)}
        className="bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
        isSatellite={showSatellite}
      />
      <ControlButton
        icon={Navigation}
        label="Smart Routing"
        active={routingPanelOpen}
        onClick={() => setRoutingPanelOpen(!routingPanelOpen)}
        className={routingPanelOpen ? '' : 'text-white/70'}
        isSatellite={showSatellite}
      />
      <ControlButton icon={Flame} label="Toggle Heatmap" active={showHeatmap} onClick={toggleHeatmap} isSatellite={showSatellite} />
      <ControlButton icon={Layers} label="Toggle Satellite" active={showSatellite} onClick={toggleSatellite} isSatellite={showSatellite} />
      <ControlButton
        icon={Crosshair}
        label="My Location"
        onClick={locate}
        className={loading ? 'animate-pulse' : ''}
        isSatellite={showSatellite}
      />
    </div>
  );
}
