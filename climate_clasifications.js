// =====================================================
// 1) MUNICÍPIOS DO PARANÁ
// =====================================================
var municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'Brazil'))
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));

Map.centerObject(municipios, 7);

// =====================================================
// 2) ASSET ZC (GYGA)
// =====================================================
var municipiosGyga = ee.FeatureCollection(
  'projects/fcoliveira/assets/CZ/zonas_climaticas'
);

var ZC = municipiosGyga.reduceToImage({
  properties: ['GYGA_CZ'],
  reducer: ee.Reducer.first()
}).rename('ZC');

// =====================================================
// 3) TERRACLIMATE (1991–2020)
// =====================================================
var tc = ee.ImageCollection('IDAHO_EPSCOR/TERRACLIMATE')
  .filterDate('1991-01-01', '2020-12-31');

var months = ee.List.sequence(1,12);

// =====================================================
// 4) CLIMATOLOGIA MENSAL
// =====================================================
function climMensal(varName, scale){
  return ee.ImageCollection.fromImages(
    months.map(function(m){
      return tc
        .filter(ee.Filter.calendarRange(m, m, 'month'))
        .select(varName)
        .mean()
        .multiply(scale)
        .set('month', m);
    })
  );
}

var tmin = climMensal('tmmn', 0.1);
var tmax = climMensal('tmmx', 0.1);
var pr   = climMensal('pr', 1.0);
var pet  = climMensal('pet', 0.1);
var def  = climMensal('def', 0.1);
var ro   = climMensal('ro', 1.0);

// Temperatura média mensal
var tmean = ee.ImageCollection.fromImages(
  months.map(function(m){
    var t = tmin.filter(ee.Filter.eq('month', m)).first()
      .add(tmax.filter(ee.Filter.eq('month', m)).first())
      .divide(2)
      .set('month', m);
    return t;
  })
);

// =====================================================
// 5) VARIÁVEIS DERIVADAS
// =====================================================
var MAT = tmean.mean();
var MAP = pr.sum().divide(30);
var Tcold = tmean.min();
var Thot = tmean.max();
var Pdry = pr.min();

var PET = pet.sum().divide(30);
var DEF = def.sum().divide(30);
var SUR = ro.sum().divide(30);

// =====================================================
// 6) KÖPPEN–GEIGER COMPLETO
// =====================================================
var verao = ee.List([11,12,1,2,3,4]);
var prVerao = ee.ImageCollection.fromImages(
  verao.map(function(m){
    return pr.filter(ee.Filter.eq('month', m)).first();
  })
).sum();

var percVerao = prVerao.divide(MAP.max(1)).multiply(100);

var ajuste = percVerao.expression(
  "(pv >= 70) ? 280 : (pv >= 30 ? 140 : 0)",
  {pv: percVerao}
);

var limiteB = MAT.multiply(20).add(ajuste);

var grupoA = Tcold.gte(18);
var grupoB = MAP.lt(limiteB);
var grupoC = Tcold.gte(-3).and(Tcold.lt(18));
var grupoD = Tcold.lt(-3);
var grupoE = Thot.lt(10);

var Af = grupoA.and(Pdry.gte(60));
var Aw = grupoA.and(Pdry.lt(60));

var BSh = grupoB.and(MAT.gte(18));
var BSk = grupoB.and(MAT.lt(18));

var Cfa = grupoC.and(Thot.gte(22));
var Cfb = grupoC.and(Thot.lt(22));

var KT = ee.Image(0).rename('KT')
  .where(Af, 1)
  .where(Aw, 2)
  .where(BSh, 3)
  .where(BSk, 4)
  .where(Cfa, 5)
  .where(Cfb, 6)
  .where(grupoD, 7)
  .where(grupoE, 8);

// =====================================================
// 7) THORNTHWAITE
// =====================================================
var Ih = SUR.divide(PET).multiply(100);
var Ia = DEF.divide(PET).multiply(100);
var Im = Ih.subtract(Ia.multiply(0.6));

var TH = ee.Image(0).rename('TH')
  .where(Im.gte(100), 1)
  .where(Im.gte(80).and(Im.lt(100)), 2)
  .where(Im.gte(60).and(Im.lt(80)), 3)
  .where(Im.gte(40).and(Im.lt(60)), 4)
  .where(Im.gte(20).and(Im.lt(40)), 5)
  .where(Im.gte(0).and(Im.lt(20)), 6)
  .where(Im.gte(-20).and(Im.lt(0)), 7)
  .where(Im.gte(-40).and(Im.lt(-20)), 8)
  .where(Im.lt(-40), 9);

// =====================================================
// 8) CAMARGO
// =====================================================
var CM_T = ee.Image(0)
.where(MAT.lte(3), 1)
.where(MAT.gt(3).and(MAT.lte(7)), 2)
.where(MAT.gt(7).and(MAT.lte(12)), 3)
.where(MAT.gt(12).and(MAT.lte(18)), 4)
.where(MAT.gt(18).and(MAT.lte(22)), 5)
.where(MAT.gt(22), 6);

var CM_H = ee.Image(0)
.where(DEF.gt(800).and(SUR.eq(0)), 1)
.where(DEF.gt(150).and(SUR.lte(200)), 2)
.where(DEF.gt(150).and(SUR.gt(200)), 3)
.where(DEF.gt(0).and(DEF.lte(150)).and(SUR.lte(200)), 4)
.where(DEF.gt(0).and(DEF.lte(150)).and(SUR.gt(200)), 5);

var CM = CM_T.multiply(10).add(CM_H).rename('CM');

// =====================================================
// 9) MAPAS
// =====================================================
Map.addLayer(KT.clip(municipios),
  {min:1, max:8,
   palette:['#006837','#1a9850','#fdae61','#f46d43',
            '#1E90FF','#87CEFA','#542788','#bababa']},
  'Köppen–Geiger');

Map.addLayer(TH.clip(municipios),
  {min:1, max:9,
   palette:['#08306b','#2171b5','#6baed6','#c6dbef',
            '#ffffcc','#feb24c','#fd8d3c','#f03b20','#bd0026']},
  'Thornthwaite');

Map.addLayer(CM.clip(municipios),
  {min:11, max:65,
   palette:['#ffffcc','#ffeda0','#feb24c','#f03b20',
            '#bd0026','#31a354','#006837']},
  'Camargo');

Map.addLayer(ZC.clip(municipios),
  {palette:[
   'FF0000','0000FF','008000','FFFF00','800080',
   'FFA500','00FFFF','FF00FF','A52A2A','FFC0CB',
   '00FF00','008080'
  ]},
  'ZC – GYGA');

// Contorno
Map.addLayer(
  municipios.style({color:'black',fillColor:'00000000',width:0.5}),
  {},
  'Municípios PR'
);

// =====================================================
// EMPILHAR AS 4 CLASSIFICAÇÕES
// =====================================================
// =====================================================
// EMPILHAR COM UNMASK
// =====================================================
var stack = KT.unmask(-9999)
              .addBands(TH.unmask(-9999))
              .addBands(CM.unmask(-9999))
              .addBands(ZC.unmask(-9999));

// =====================================================
// REDUÇÃO MUNICIPAL
// =====================================================
var fcReduced = stack.reduceRegions({
  collection: municipios,
  reducer: ee.Reducer.mode(),
  scale: 4000
});

print('Exemplo município:', fcReduced.first());

// =====================================================
// GERAR CENTROIDE
// =====================================================
var fcCentroid = fcReduced.map(function(f){

  var centroid = f.geometry().centroid({maxError: 1});

  return ee.Feature(centroid).set({
    municipio: f.get('ADM2_NAME'),
    estado: f.get('ADM1_NAME'),
    lat: centroid.coordinates().get(1),
    lon: centroid.coordinates().get(0),

    KT: f.get('KT'),
    TH: f.get('TH'),
    CM: f.get('CM'),
    ZC: f.get('ZC')
  });

});

// =====================================================
// EXPORTAÇÃO
// =====================================================
Export.table.toDrive({
  collection: fcCentroid,
  description: 'PR_Classificacoes_Climaticas_1991_2020_CENTROIDE',
  folder: 'TerraClimate_PR',
  fileNamePrefix: 'PR_Classificacoes_Climaticas_1991_2020_CENTROIDE',
  fileFormat: 'CSV'
});
