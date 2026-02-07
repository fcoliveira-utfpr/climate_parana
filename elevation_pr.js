// =====================================================
// 1. Limite do Paraná (GAUL)
// =====================================================
var municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));

var parana = municipios.geometry();

// Visualização
Map.centerObject(parana, 7);
Map.addLayer(parana, {color: 'red'}, 'Paraná');

// =====================================================
// 2. Carregar SRTM
// =====================================================
var srtm = ee.Image('USGS/SRTMGL1_003');

// Recortar para Paraná
var srtm_pr = srtm.clip(parana);

// Visualizar relevo
Map.addLayer(
  srtm_pr,
  {min: 0, max: 1200, palette: ['blue', 'green', 'yellow', 'brown']},
  'SRTM Paraná'
);

// =====================================================
// 3. Exportar GeoTIFF
// =====================================================
Export.image.toDrive({
  image: srtm_pr,
  description: 'SRTM_Parana_30m',
  folder: 'GEE3',
  fileNamePrefix: 'SRTM_Parana_30m',
  region: parana,
  scale: 30,
  crs: 'EPSG:4326',   
  maxPixels: 1e13
});
