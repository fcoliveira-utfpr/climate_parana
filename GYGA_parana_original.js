/**** CONFIGURAÇÕES ****/
var SCALE = 1000;        
var MAX_PIXELS = 1e13;

/**** 1. DADOS DE ENTRADA ****/
var gadm = ee.FeatureCollection("projects/fcoliveira/assets/gadm41_BRA_2");
var municipiosParana = gadm.filter(ee.Filter.eq('NAME_1', 'Paraná'));

var climateZones = ee.FeatureCollection(
  'projects/fcoliveira/assets/GygaClimateZonesShp'
);

/**** 2. RECORTE – APENAS PARANÁ ****/
var climateZonesPR = climateZones.filterBounds(
  municipiosParana.geometry()
);

/**** 3. RASTERIZAÇÃO EXPLÍCITA NA ESCALA DEFINIDA ****/
var gygaRaster = climateZonesPR
  .reduceToImage({
    properties: ['GYGA_CZ'],
    reducer: ee.Reducer.first()
  })
  .reproject({
    crs: 'EPSG:3857',   // projeção métrica
    scale: SCALE
  })
  .clip(municipiosParana);

/**** 4. CONVERTER RASTER → PONTOS (CENTRO DOS PIXELS) ****/
var gygaPoints = gygaRaster.sample({
  region: municipiosParana.geometry(),
  scale: SCALE,
  projection: 'EPSG:3857',
  geometries: true
});

/**** 5. ADICIONAR LAT / LON ****/
var gygaPointsOut = gygaPoints.map(function(f) {
  var coords = f.geometry().coordinates();
  return f.set({
    lon: coords.get(0),
    lat: coords.get(1)
  });
});

/**** 6. DIAGNÓSTICO SEGURO ****/
print('Número de pontos amostrados:', gygaPointsOut.size());
print('Amostra (10 pontos):', gygaPointsOut.limit(10));

/**** 7. EXPORTAR CSV ****/
Export.table.toDrive({
  collection: gygaPointsOut.select(['GYGA_CZ', 'lat', 'lon']),
  description: 'GYGA_CZ_original_PR_' + SCALE + 'm',
  fileFormat: 'CSV'
});
