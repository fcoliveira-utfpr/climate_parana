/**** Define ZCs predominantes em cada município ****/
/**** CONFIGURAÇÕES GERAIS ****/
var SCALE = 1000;        // ~1 km
var MAX_PIXELS = 1e13;   


/**** 1. DADOS DE ENTRADA ****/
var gadm = ee.FeatureCollection("projects/fcoliveira/assets/gadm41_BRA_2");
var municipiosParana = gadm.filter(ee.Filter.eq('NAME_1', 'Paraná'));

var climateZones = ee.FeatureCollection('projects/fcoliveira/assets/GygaClimateZonesShp');


/**** 2. IMAGEM CATEGÓRICA GYGA_CZ (raster de zonas) ****/
var climateImage = climateZones.reduceToImage({
  properties: ['GYGA_CZ'],
  reducer: ee.Reducer.first()
}).round().toInt();


/**** 3. ZONA PREDOMINANTE POR MUNICÍPIO ****/
var municipiosGyga = municipiosParana.map(function(municipio) {
  var zonaPredominante = ee.Number(
    climateImage.reduceRegion({
      reducer: ee.Reducer.mode(),
      geometry: municipio.geometry(),
      scale: SCALE,
      maxPixels: MAX_PIXELS
    }).get('first')
  ).round().toInt();  

  return municipio.set('GYGA_CZ', zonaPredominante);
});


/**** 4. IMAGEM COROPLÉTICA POR MUNICÍPIO (predominância) ****/
var gygaMunicipalImage = municipiosGyga.reduceToImage({
  properties: ['GYGA_CZ'],
  reducer: ee.Reducer.first()
});


/**** 5. DEFINIR PALETA ****/
var gygaPalette = [
  "red","blue","green","yellow","purple","orange",
  "cyan","magenta","brown","pink","lime","teal"
];


/**** 6. INTERVALO DE VISUALIZAÇÃO ****/
var visMunicipios = {
  palette: gygaPalette,
  min: 5900.999999999998,
  max: 7901
};

/**** 7. CAMADAS VETORIAIS POR GYGA_CZ (MUNICÍPIOS PREDOMINANTES) ****/
var czListMun = municipiosGyga.aggregate_array('GYGA_CZ').distinct().sort();
print('Valores únicos de GYGA_CZ (municípios predominantes):', czListMun);


// Paleta HEX 
var gygaPaletteHex = [
  'FF0000', // red
  '0000FF', // blue
  '008000', // green
  'FFFF00', // yellow
  '800080', // purple
  'FFA500', // orange
  '00FFFF', // cyan
  'FF00FF', // magenta
  'A52A2A', // brown
  'FFC0CB', // pink
  '00FF00', // lime
  '008080'  // teal
];


// Loop client-side para criar camadas
czListMun.evaluate(function(vals) {
  vals.forEach(function(v, idx) {
    var color = gygaPaletteHex[idx % gygaPaletteHex.length];

    var fcMun = municipiosGyga.filter(ee.Filter.eq('GYGA_CZ', v));

    // Municípios individuais
    var styledMun = fcMun.style({
      color: '000000',
      width: 1,
      fillColor: color
    });
    Map.addLayer(styledMun, {}, 'Municípios CZ ' + v);
  });
});


/**** 8. CALCULA ÁREA E NÚMERO DE MUNICÍPIOS POR ZONA ****/
czListMun.evaluate(function(lista) {

  print('--- Estatísticas por Zona Climática (Predominante) ---');

  lista.forEach(function(cz_value) {

    var fc = municipiosGyga.filter(ee.Filter.eq('GYGA_CZ', cz_value));

    var nMunicipios = fc.size();

    var areaM2 = fc
      .map(function(f) { return f.set('area', f.geometry().area()); })
      .aggregate_sum('area');

    var areaKm2 = ee.Number(areaM2).divide(1e6);

    print(
      'Zona', cz_value,
      ee.Dictionary({
        'N_municipios': nMunicipios,
        'Area_km2': areaKm2
      })
    );
  });
});


/*****************************************************************
 * 9. EXPORTAR RESULTADOS
 *****************************************************************/

/*** (A) EXPORTAR MUNICÍPIOS COM ZONA PREDOMINANTE (ASSET) ***/
Export.table.toAsset({
  collection: municipiosGyga,
  description: 'Municipios_Parana_GYGA_CZ',
  assetId: 'projects/fcoliveira/assets/CZ/zonas_climaticas'
});


/*** (B) EXPORTAR MUNICÍPIOS COM ZONA PREDOMINANTE (CSV) ***/
Export.table.toDrive({
  collection: municipiosGyga,
  description: 'Municipios_Parana_GYGA_CZ',
  fileFormat: 'CSV'
});
