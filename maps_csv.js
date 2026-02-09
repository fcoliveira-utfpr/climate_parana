// =====================================================
// 0) Obtenção de tratamento dos dados meteorológicos
// =====================================================
// =====================================================
// 1) Municípios do Paraná
// =====================================================
var municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));

Map.centerObject(municipios, 7);

// =====================================================
// 2) TerraClimate (1991–2020)
// =====================================================
var tc = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
  .filterDate('1991-01-01', '2020-12-31');

// =====================================================
// 3) Configuração das variáveis
// =====================================================
var cfg = {
  def:  {agg: 'sum',  scale: 0.1,
         vis: {min: 0,   max: 800,
               palette: ['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#d95f0e','#993404']}},
  pet:  {agg: 'sum',  scale: 0.1,
         vis: {min: 600, max: 2200,
               palette: ['#f7fcfd','#e0ecf4','#bfd3e6','#9ebcda','#8c96c6','#8c6bb1','#88419d','#6e016b']}},
  pr:   {agg: 'sum',  scale: 1.0,
         vis: {min: 800, max: 2000,
               palette: ['lightyellow','lightskyblue','blue','darkblue']}},
  ro:   {agg: 'sum',  scale: 1.0,
         vis: {min: 0,   max: 600,
               palette: ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c']}},
  tmmn: {agg: 'mean', scale: 0.1,
         vis: {min: 8,  max: 22,
               palette: ['#f7fbff','#c6dbef','#6baed6','#2171b5','#08306b']}},
  tmmx: {agg: 'mean', scale: 0.1,
         vis: {min: 22, max: 36,
               palette: ['#ffffcc','#ffeda0','#feb24c','#f03b20','#bd0026']}}
};

// =====================================================
// 4) Função: climatologia anual (1991–2020)
// =====================================================
function climatologiaAnual(varName, cfgVar) {

  var ic = tc.select(varName);

  var img = ee.Image(
    ee.Algorithms.If(
      cfgVar.agg === 'sum',
      ic.sum().divide(30),  // média anual
      ic.mean()
    )
  ).multiply(cfgVar.scale);

  return img;
}

// =====================================================
// 5) Loop: gerar mapas
// =====================================================
Object.keys(cfg).forEach(function(varName) {

  // Climatologia da variável
  var img = climatologiaAnual(varName, cfg[varName]);

  // Média municipal
  var fc = img.reduceRegions({
    collection: municipios,
    reducer: ee.Reducer.mean(),
    scale: 4000
  });

  // Converter para imagem (1 banda válida)
  var imgMun = fc.reduceToImage({
    properties: ['mean'],
    reducer: ee.Reducer.first()
  }).rename(varName);

  // --------------------------------
  // 5.1 Camada NUMÉRICA (Inspector)
  // --------------------------------
  Map.addLayer(
    imgMun.clip(municipios),
    {
      min: cfg[varName].vis.min,
      max: cfg[varName].vis.max
    },
    varName + ' – valores (Inspector)',
    false
  );

  // --------------------------------
  // 5.2 Camada VISUAL
  // --------------------------------
  Map.addLayer(
    imgMun.clip(municipios).visualize(cfg[varName].vis),
    {},
    varName + ' – média anual municipal (1991–2020)'
  );
});

// =====================================================
// 6) Contorno dos municípios
// =====================================================
Map.addLayer(
  municipios.style({
    color: 'black',
    fillColor: '00000000',
    width: 0.4
  }),
  {},
  'Municípios – PR'
);

// =====================================================
// 7) EXPORTAR CADA VARIÁVEL COMO ASSET
// =====================================================

Object.keys(cfg).forEach(function(varName) {

  // Climatologia anual
  var img = climatologiaAnual(varName, cfg[varName]);

  // Média municipal
  var fc = img.reduceRegions({
    collection: municipios,
    reducer: ee.Reducer.mean(),
    scale: 4000
  });

  // Converter para imagem
  var imgMun = fc.reduceToImage({
    properties: ['mean'],
    reducer: ee.Reducer.first()
  }).rename(varName);

  // ------------------------------------
  // EXPORTAÇÃO PARA ASSET
  // ------------------------------------
  Export.image.toAsset({
    image: imgMun.clip(municipios),
    description: 'PR_' + varName + '_municipal_1991_2020',
    assetId: 'projects/fcoliveira/assets/PR_Municipal_1991_2020/' +
             varName + '_municipal_1991_2020',
    region: municipios.geometry(),
    scale: 4000,
    maxPixels: 1e13
  });

});
// =====================================================
// 8) EXPORTAR CSV (valor + lat + lon + município)
// =====================================================

Object.keys(cfg).forEach(function(varName) {

  // Climatologia anual
  var img = climatologiaAnual(varName, cfg[varName]);

  // Média municipal
  var fc = img.reduceRegions({
    collection: municipios,
    reducer: ee.Reducer.mean(),
    scale: 4000
  });

  // Adicionar latitude, longitude e nome do município
  var fcOut = fc.map(function(f) {

    var centroid = f.geometry().centroid(1);

    return f.set({
      variavel: varName,
      valor: f.get('mean'),
      lon: centroid.coordinates().get(0),
      lat: centroid.coordinates().get(1),
      municipio: f.get('ADM2_NAME'),
      estado: f.get('ADM1_NAME')
    });

  }).select([
    'variavel',
    'valor',
    'lat',
    'lon',
    'municipio',
    'estado'
  ]);

  // ------------------------------------
  // EXPORTAÇÃO CSV
  // ------------------------------------
  Export.table.toDrive({
    collection: fcOut,
    description: 'PR_' + varName + '_municipal_1991_2020_CSV',
    folder: 'TerraClimate_PR',
    fileNamePrefix: varName + '_municipal_1991_2020',
    fileFormat: 'CSV'
  });

});
