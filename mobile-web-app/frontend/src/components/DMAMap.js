import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, LayersControl, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, CircularProgress, Alert, Chip, Stack, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

// Fix for default markers in react-leaflet v4
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different point types
const inletIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const outletIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const readingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Your Jafar coordinates (from your data)
const jafarPoints = [
 [8.979636347,38.77195634],
 [8.979636158,38.77195653],
 [8.979431105,38.77203934],
 [8.979068913,38.77217818],
 [8.978507516,38.77241964],
 [8.978175506,38.77255094],
 [8.977591472,38.77279693],
 [8.97728059,38.77292822],
 [8.976851996,38.77311686],
 [8.976542624,38.77325872],
 [8.976240798,38.77335983],
 [8.976023482,38.77344736],
 [8.975780512,38.77354848],
 [8.975347391,38.77371901],
 [8.97465168,38.77401178],
 [8.974102356,38.77424871],
 [8.973860895,38.77436643],
 [8.973509267,38.77454601],
 [8.973240641,38.77468183],
 [8.972561531,38.77510741],
 [8.972090681,38.77467278],
 [8.97184922,38.77414156],
 [8.971897512,38.77236682],
 [8.97291165,38.77181146],
 [8.973491157,38.77164244],
 [8.974046518,38.77076111],
 [8.973805057,38.76951758],
 [8.973901641,38.76898637],
 [8.974275906,38.76833442],
 [8.974951998,38.76747723],
 [8.97484334,38.76620956],
 [8.975302117,38.76587152],
 [8.975736747,38.76625785],
 [8.977113077,38.76725992],
 [8.978175506,38.76893807],
 [8.978839525,38.770248],
 [8.979636347,38.77195634],

];

// Your Yeka coordinates (from your data)
const yekaPoints = [
  [9.029017912, 38.78849769],
  [9.028443849, 38.78956420],
  [9.027918401, 38.79042458],
  [9.026483267, 38.79283834],
  [9.024673299, 38.79582083],
  [9.023091810, 38.79855373],
  [9.021952832, 38.80064259],
  [9.021469027, 38.80143512],
  [9.020125707, 38.80149103],
  [9.019886421, 38.80122422],
  [9.020319431, 38.79982285],
  [9.020572587, 38.79886941],
  [9.020681959, 38.79756940],
  [9.020786743, 38.79663531],
  [9.021000201, 38.79489037],
  [9.021264259, 38.79207005],
  [9.021424894, 38.79047872],
  [9.021424444, 38.78969153],
  [9.021675076, 38.78855753],
  [9.022131446, 38.78678367],
  [9.022370178, 38.78577848],
  [9.022447793, 38.78549918],
  [9.022811965, 38.78558780],
  [9.023135088, 38.78566560],
  [9.023915884, 38.78587410],
  [9.025208895, 38.78618528],
  [9.026357516, 38.78666344],
  [9.027850784, 38.78762024],
  [9.029068397, 38.78834161],
  [9.029058874, 38.78842828],
  [9.029017912, 38.78849769]
];

// Center between Jafar and Yeka
const mapCenter = [9.00, 38.78];

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.1.16:8000/api';

export default function DMAMap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readings, setReadings] = useState([]);
  const [inletMarkers, setInletMarkers] = useState([]);
  const [outletMarkers, setOutletMarkers] = useState([]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/bulk-readings`);
      
      // Filter readings that have GPS coordinates
      const readingsWithGPS = response.data.filter(r => r.latitude && r.longitude);
      setReadings(readingsWithGPS);
      
      // Separate inlets and outlets
      setInletMarkers(readingsWithGPS.filter(r => r.pointType === 'inlet'));
      setOutletMarkers(readingsWithGPS.filter(r => r.pointType === 'outlet'));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError('Failed to load reading locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e3a8a' }}>
            DMA Map View
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {jafarPoints.length} points for Jafar | {yekaPoints.length} points for Yeka
          </Typography>
        </Box>
        <Tooltip title="Refresh readings">
          <IconButton onClick={fetchReadings} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Legend */}
      <Box sx={{ 
        position: 'absolute', 
        top: 100, 
        right: 30, 
        zIndex: 1000, 
        bgcolor: 'white', 
        p: 2, 
        borderRadius: 2, 
        boxShadow: 3,
        border: '1px solid #ccc',
        minWidth: 200
      }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold', borderBottom: '1px solid #eee', pb: 0.5 }}>
          Map Legend
        </Typography>
        
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          <span style={{color: '#FF6B6B', fontSize: '16px'}}>⬤</span> <strong>Jafar DMA</strong>
        </Typography>
        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
          <span style={{color: '#4ECDC4', fontSize: '16px'}}>⬤</span> <strong>Yeka DMA</strong>
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.5, fontWeight: 'bold' }}>
          Markers:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip 
            icon={<Box sx={{ width: 12, height: 12, bgcolor: '#1976d2', borderRadius: '50%' }} />} 
            label={`Inlets (${inletMarkers.length})`}
            size="small"
          />
          <Chip 
            icon={<Box sx={{ width: 12, height: 12, bgcolor: '#f57c00', borderRadius: '50%' }} />} 
            label={`Outlets (${outletMarkers.length})`}
            size="small"
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip 
            icon={<Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />} 
            label={`Readings (${readings.length})`}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '600px', width: '100%', borderRadius: '12px' }}
      >
        {/* OpenStreetMap tiles - FREE, no API key */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <LayersControl position="topright">
          {/* DMA Boundaries Layer */}
          <LayersControl.Overlay checked name="DMA Boundaries">
            <FeatureGroup>
              {/* Jafar DMA - Red */}
              <Polygon
                positions={jafarPoints}
                pathOptions={{
                  color: '#FF0000',
                  fillColor: '#FF6B6B',
                  fillOpacity: 0.5,
                  weight: 3
                }}
              >
                <Popup>
                  <strong>Jafar DMA</strong><br/>
                  Inlets: Bulk Didly, Shemachoch<br/>
                  Outlet: Tel<br/>
                  <Chip label="DMA-JFR" size="small" sx={{ mt: 1 }} />
                </Popup>
              </Polygon>

              {/* Yeka DMA - Blue */}
              <Polygon
                positions={yekaPoints}
                pathOptions={{
                  color: '#0000FF',
                  fillColor: '#4ECDC4',
                  fillOpacity: 0.5,
                  weight: 3
                }}
              >
                <Popup>
                  <strong>Yeka DMA</strong><br/>
                  Inlets: Misrak, English, Wubet<br/>
                  Outlets: None<br/>
                  <Chip label="DMA-YKA" size="small" sx={{ mt: 1 }} />
                </Popup>
              </Polygon>
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Inlet Markers Layer */}
          <LayersControl.Overlay checked name="Inlet Markers">
            <FeatureGroup>
              {inletMarkers.map((reading, index) => (
                <Marker
                  key={`inlet-${index}`}
                  position={[reading.latitude, reading.longitude]}
                  icon={inletIcon}
                >
                  <Popup>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {reading.pointName} (Inlet)
                    </Typography>
                    <Typography variant="caption" display="block">
                      DMA: {reading.dmaId}
                    </Typography>
                    <Typography variant="caption" display="block" color="success.main">
                      Reading: {reading.meterReading} m³
                    </Typography>
                    <Typography variant="caption" display="block">
                      {formatDate(reading.timestamp)}
                    </Typography>
                    {reading.notes && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Note: {reading.notes}
                      </Typography>
                    )}
                    <Chip label="Inlet" size="small" color="primary" sx={{ mt: 1 }} />
                  </Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Outlet Markers Layer */}
          <LayersControl.Overlay checked name="Outlet Markers">
            <FeatureGroup>
              {outletMarkers.map((reading, index) => (
                <Marker
                  key={`outlet-${index}`}
                  position={[reading.latitude, reading.longitude]}
                  icon={outletIcon}
                >
                  <Popup>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {reading.pointName} (Outlet)
                    </Typography>
                    <Typography variant="caption" display="block">
                      DMA: {reading.dmaId}
                    </Typography>
                    <Typography variant="caption" display="block" color="success.main">
                      Reading: {reading.meterReading} m³
                    </Typography>
                    <Typography variant="caption" display="block">
                      {formatDate(reading.timestamp)}
                    </Typography>
                    {reading.notes && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Note: {reading.notes}
                      </Typography>
                    )}
                    <Chip label="Outlet" size="small" color="warning" sx={{ mt: 1 }} />
                  </Popup>
                </Marker>
              ))}
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Fixed Inlet Locations (for reference) */}
          <LayersControl.Overlay name="Fixed Inlet Locations">
            <FeatureGroup>
              <Marker position={[8.979563, 38.772241]} icon={inletIcon}>
                <Popup>
                  <strong>Bulk Didly Inlet</strong><br/>
                  Jafar DMA<br/>
                  <Chip label="Reference Point" size="small" variant="outlined" />
                </Popup>
              </Marker>
              <Marker position={[8.977120, 38.773132]} icon={inletIcon}>
                <Popup>
                  <strong>Shemachoch Inlet</strong><br/>
                  Jafar DMA<br/>
                  <Chip label="Reference Point" size="small" variant="outlined" />
                </Popup>
              </Marker>
              <Marker position={[9.026084, 38.786720]} icon={inletIcon}>
                <Popup>
                  <strong>Misrak Inlet</strong><br/>
                  Yeka DMA<br/>
                  <Chip label="Reference Point" size="small" variant="outlined" />
                </Popup>
              </Marker>
              <Marker position={[9.028878, 38.788419]} icon={inletIcon}>
                <Popup>
                  <strong>English Inlet</strong><br/>
                  Yeka DMA<br/>
                  <Chip label="Reference Point" size="small" variant="outlined" />
                </Popup>
              </Marker>
              <Marker position={[9.0221,38.7997]} icon={inletIcon}>
                <Popup>
                  <strong>Wubet Inlet</strong><br/>
                  Yeka DMA<br/>
                  <Chip label="Reference Point" size="small" variant="outlined" />
                </Popup>
              </Marker>
            </FeatureGroup>
          </LayersControl.Overlay>

          {/* Fixed Outlet Locations */}
          <LayersControl.Overlay name="Fixed Outlet Locations">
            <FeatureGroup>
              <Marker position={[8.973852, 38.774331]} icon={outletIcon}>
                <Popup>
                  <strong>Tel Outlet</strong><br/>
                  Jafar DMA<br/>
                  <Chip label="Reference Point" size="small" variant="outlined" />
                </Popup>
              </Marker>
            </FeatureGroup>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {/* Readings Summary */}
      {readings.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Recent Reading Locations ({readings.length} total)
          </Typography>
          <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
            {readings.slice(0, 10).map((reading, idx) => (
              <Box
                key={idx}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1, borderBottom: '1px solid #eee' }}
              >
                <Box>
                  <Typography variant="body2">
                    <strong>{reading.pointName}</strong> ({reading.dmaId})
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {reading.latitude?.toFixed(4)}, {reading.longitude?.toFixed(4)}
                  </Typography>
                </Box>
                <Chip 
                  label={`${reading.meterReading} m³`}
                  size="small"
                  color={reading.pointType === 'inlet' ? 'primary' : 'warning'}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}