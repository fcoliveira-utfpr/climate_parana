// =====================================================
// 1. Limite do Paraná (GAUL)
// =====================================================
var municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));

var parana = municipios.geometry();

// =====================================================
// 2. Carregar Climate Zones (GYGA)
// =====================================================
var climateZones = ee.FeatureCollection(
  'projects/fcoliveira/assets/GygaClimateZonesShp'
);

// =====================================================
// 3. Recortar para o Paraná
// =====================================================
var climateZones_PR = climateZones.filterBounds(parana);

// Visualização
Map.centerObject(parana, 7);
Map.addLayer(climateZones_PR, {}, 'GYGA Paraná');
Map.addLayer(parana, {color: 'red'}, 'Limite Paraná');

// =====================================================
// 4. Rasterizar
// =====================================================
var raster = climateZones_PR.reduceToImage({
  properties: ['GYGA_CZ'],
  reducer: ee.Reducer.first()
});

// Visualizar raster
Map.addLayer(raster, {min: 1, max: 20}, 'Raster GYGA');

// =====================================================
// 5. Exportar GeoTIFF
// =====================================================
Export.image.toDrive({
  image: raster,
  description: 'GYGA_ClimateZones_Parana',
  folder: 'GEE3',
  fileNamePrefix: 'GYGA_ClimateZones_Parana',
  region: parana,
  scale: 30,
  maxPixels: 1e13
});
