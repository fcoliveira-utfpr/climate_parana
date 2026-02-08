// =====================================================
// 0. Gera vetor de altitudes
// =====================================================

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

// Recortar Paraná
var srtm_pr = srtm.clip(parana);

// =====================================================
// 3. Converter raster para pontos (30 m)
// =====================================================

var pontos = srtm_pr.sample({
  region: parana,
  scale: 30,
  numPixels: 1000000,   
  seed: 1,
  geometries: true
});

// Visualizar amostra
print('Primeiros pontos:', pontos.limit(5));
Map.addLayer(pontos.limit(5000), {}, 'Pontos SRTM');

// =====================================================
// 4. Exportar CSV
// =====================================================
Export.table.toDrive({
  collection: pontos,
  description: 'SRTM_Parana_30m_Pontos',
  folder: 'GEE3',
  fileNamePrefix: 'SRTM_Parana_30m',
  fileFormat: 'CSV'
});

