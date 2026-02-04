// =====================================================
// PARÂMETROS
// =====================================================
var zonaClimatica = 6601;
var anos_ini = 1991;
var anos_fim = 2020;
var scale_m = 4000;

var asset_cz = 'projects/fcoliveira/assets/CZ/' + zonaClimatica;

// =====================================================
// REGIÕES
// =====================================================
var cz = ee.FeatureCollection(asset_cz);
var cz_geom = cz.geometry();

// Municípios e estado
var municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));

var estado = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));

Map.centerObject(cz, 7);

// =====================================================
// CONFIG
// =====================================================
var cfg = {
  def: {agg:'sum', scale:0.1},
  pet: {agg:'sum', scale:0.1},
  pr:  {agg:'sum', scale:1},
  ro:  {agg:'sum', scale:1},
  tmmn:{agg:'mean', scale:0.1},
  tmmx:{agg:'mean', scale:0.1}
};

var vars = ['def','pet','pr','ro','tmmn','tmmx'];

// =====================================================
// TERRACLIMATE
// =====================================================
var tc = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
            .filterDate(anos_ini + '-01-01', anos_fim + '-12-31');

// =====================================================
// FUNÇÃO CLIMATOLOGIA
// =====================================================
function climatologia(variavel){

  var vcfg = cfg[variavel];
  var col = tc.select(variavel);
  var anos = ee.List.sequence(anos_ini, anos_fim);

  var anual = ee.ImageCollection(
    anos.map(function(y){

      var col_y = col.filter(ee.Filter.calendarRange(y, y, 'year'));

      var img = ee.Image(
        ee.Algorithms.If(
          vcfg.agg === 'sum',
          col_y.sum(),
          col_y.mean()
        )
      ).rename(variavel);

      return img;
    })
  );

  return anual.mean().multiply(vcfg.scale);
}

// =====================================================
// AMOSTRAGEM PIXEL A PIXEL
// =====================================================
var tabelaFinal = ee.FeatureCollection([]);

vars.forEach(function(v){

  var img = climatologia(v).clip(cz);

  // Amostrar pixels
  var samples = img.sample({
    region: cz_geom,
    scale: scale_m,
    geometries: true
  });

  // Enriquecer atributos
  samples = samples.map(function(f){

    var geom = f.geometry();
    var coords = geom.coordinates();

    var lon = coords.get(0);
    var lat = coords.get(1);

    // Município
    var muni = municipios.filterBounds(geom).first();

    var nome_muni = ee.Algorithms.If(
      muni,
      muni.get('ADM2_NAME'),
      'NA'
    );

    // Estado
    var nome_estado = 'Parana';

    return ee.Feature(null, {
      estado: nome_estado,
      lat: lat,
      lon: lon,
      municipio: nome_muni,
      valor: f.get(v),
      variavel: v,
      ZC: zonaClimatica
    });

  });

  tabelaFinal = tabelaFinal.merge(samples);

});

// =====================================================
// EXPORTAR CSV
// =====================================================
Export.table.toDrive({
  collection: tabelaFinal,
  description: 'Pixels_ZC_' + zonaClimatica,
  fileFormat: 'CSV'
});
