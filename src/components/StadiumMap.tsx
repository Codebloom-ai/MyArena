import React from 'react';
import { DynamicStadiumMap } from './DynamicStadiumMap';
import { Incident, StadiumZone } from '../types/stadium';

interface StadiumMapProps {
  incidents: Incident[];
  selectedZone: StadiumZone | 'All';
  onSelectZone: (zone: StadiumZone | 'All') => void;
  interactiveMode?: 'filter' | 'picker';
  onPickZone?: (zone: StadiumZone) => void;
  pickedZone?: StadiumZone;
}

export const StadiumMap: React.FC<StadiumMapProps> = (props) => {
  return <DynamicStadiumMap {...props} />;
};
