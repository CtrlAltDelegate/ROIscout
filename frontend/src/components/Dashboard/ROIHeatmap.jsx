import React, { useEffect, useRef, useState } from 'react';

const ROIHeatmap = ({ data }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('gross_rental_yield');

  // Sample coordinates for demonstration - in real app, you'd get these from
