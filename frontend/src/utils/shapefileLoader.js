// Utility to load and parse GeoJSON files

export const loadShapefile = async (dmaName) => {
  try {
    // Map DMA names to filenames
    const fileMap = {
      'DMA-JFR': 'jafar.geojson',
      'DMA-YKA': 'yeka.geojson',
      'DMA-2019': 'dma2019.geojson'
    };

    const filename = fileMap[dmaName];
    if (!filename) {
      console.warn(`No shapefile found for ${dmaName}`);
      return null;
    }

    // Fetch the GeoJSON file
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load shapefile for ${dmaName}`);
    }

    const geojson = await response.json();
    return geojson;
  } catch (error) {
    console.error('Error loading shapefile:', error);
    return null;
  }
};

// Convert GeoJSON to Google Maps polygon coordinates
export const geojsonToGoogleMaps = (geojson) => {
  if (!geojson || !geojson.features || geojson.features.length === 0) {
    return [];
  }

  // Extract coordinates from the first feature
  const feature = geojson.features[0];
  const geometry = feature.geometry;

  if (geometry.type === 'Polygon') {
    // For Polygon, take the first ring (exterior boundary)
    return geometry.coordinates[0].map(([lng, lat]) => ({
      lat,
      lng
    }));
  } else if (geometry.type === 'MultiPolygon') {
    // For MultiPolygon, take the first polygon's exterior ring
    return geometry.coordinates[0][0].map(([lng, lat]) => ({
      lat,
      lng
    }));
  }

  return [];
};

// Calculate center point of a polygon
export const calculatePolygonCenter = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let latSum = 0;
  let lngSum = 0;

  coordinates.forEach(coord => {
    latSum += coord.lat;
    lngSum += coord.lng;
  });

  return {
    lat: latSum / coordinates.length,
    lng: lngSum / coordinates.length
  };
};