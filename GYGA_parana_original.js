/**** Vetorização do GYGA original ****/
/**** CONFIGURAÇÕES ****/
var SCALE = 1000;        // Escala desejada (m)
var MAX_PIXELS = 1e13;

/**** 1. DADOS DE ENTRADA ****/
var gadm = ee.FeatureCollection("projects/fcoliveira/assets/gadm41_BRA_2");
var municipiosParana = gadm.filter(ee.Filter.eq('NAME_1', 'Paraná'));

var climateZones = ee.FeatureCollection(
  'projects/fcoliveira/assets/GygaClimateZonesShp'
);

/**** DIAGNÓSTICO 1 – Checar Paraná ****/
print('Número de municípios no PR:', municipiosParana.size());
Map.centerObject(municipiosParana, 7);
Map.addLayer(municipiosParana, {color: 'red'}, 'Paraná');

/**** 2. RECORTE – APENAS PARANÁ ****/
var climateZonesPR = climateZones.filterBounds(
  municipiosParana.geometry()
);

/**** DIAGNÓSTICO 2 – Checar recorte GYGA ****/
print('Número de polígonos GYGA no PR:', climateZonesPR.size());
Map.addLayer(climateZonesPR, {}, 'GYGA PR');

/**** 3. RASTERIZAÇÃO ****/
var gygaRaster = climateZonesPR
  .reduceToImage({
    properties: ['GYGA_CZ'],
    reducer: ee.Reducer.first()
  })
  .rename('GYGA_CZ')   // <<< CORREÇÃO ESSENCIAL
  .reproject({
    crs: 'EPSG:3857',
    scale: SCALE
  })
  .clip(municipiosParana);

/**** DIAGNÓSTICO 3 – Banda raster ****/
print('Bandas do raster:', gygaRaster.bandNames());

Map.addLayer(
  gygaRaster,
  {min: 1, max: 20, palette: ['blue','green','yellow','orange','red']},
  'GYGA Raster'
);

/**** 4. CONVERTER RASTER → PONTOS ****/
var gygaPoints = gygaRaster
  .updateMask(gygaRaster)
  .sample({
    region: municipiosParana.geometry(),
    scale: SCALE,
    projection: 'EPSG:3857',
    geometries: true
  });

/**** DIAGNÓSTICO 4 – Quantidade de pontos ****/
print('Número de pontos amostrados:', gygaPoints.size());

/**** 5. ADICIONAR LAT / LON ****/
var gygaPointsOut = gygaPoints.map(function(f) {
  var coords = f.geometry().coordinates();
  return f.set({
    lon: coords.get(0),
    lat: coords.get(1)
  });
});

/**** DIAGNÓSTICO 5 – Preview dos dados ****/
print('Amostra (10 pontos):', gygaPointsOut.limit(10));

/**** DIAGNÓSTICO 6 – Estatística das classes ****/
print(
  'Contagem por classe GYGA:',
  gygaPointsOut.aggregate_histogram('GYGA_CZ')
);

/**** 6. EXPORTAR CSV ****/
Export.table.toDrive({
  collection: gygaPointsOut.select(['GYGA_CZ', 'lat', 'lon']),
  description: 'GYGA_CZ_original_PR_' + SCALE + 'm',
  fileFormat: 'CSV'
});
