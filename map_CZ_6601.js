// =====================================================
// PARAMETERS
// =====================================================
var zonaClimatica = 6601;      // Climate zone identifier
var anos_ini = 1991;           // Start year
var anos_fim = 2020;           // End year
var scale_m = 4000;            // Sampling scale in meters (4km grid)

var asset_cz = 'projects/fcoliveira/assets/CZ/' + zonaClimatica;  // Path to climate zone asset

// =====================================================
// REGIONS
// =====================================================
var cz = ee.FeatureCollection(asset_cz);  // Load climate zone
var cz_geom = cz.geometry();               // Get its geometry

// Municipalities and state boundaries
var municipios = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));  // Filter municipalities in Paraná state

var estado = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Parana'));  // Load Paraná state boundary

Map.centerObject(cz, 7);  // Center map on climate zone with zoom level 7

// =====================================================
// CONFIGURATION
// =====================================================
var cfg = {
  def: {agg:'sum', scale:0.1},   // Water deficit: sum, scale factor 0.1
  pet: {agg:'sum', scale:0.1},   // Potential evapotranspiration: sum, scale factor 0.1
  pr:  {agg:'sum', scale:1},     // Precipitation: sum, scale factor 1
  ro:  {agg:'sum', scale:1},      // Runoff: sum, scale factor 1
  tmmn:{agg:'mean', scale:0.1},   // Minimum temperature: mean, scale factor 0.1
  tmmx:{agg:'mean', scale:0.1}    // Maximum temperature: mean, scale factor 0.1
};

var vars = ['def','pet','pr','ro','tmmn','tmmx'];  // List of variables to process

// =====================================================
// TERRACLIMATE DATA
// =====================================================
var tc = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
            .filterDate(anos_ini + '-01-01', anos_fim + '-12-31');  // Filter by date range

// =====================================================
// CLIMATOLOGY FUNCTION
// =====================================================
function climatologia(variavel){

  var vcfg = cfg[variavel];                    // Get configuration for this variable
  var col = tc.select(variavel);                // Select variable from TerraClimate
  var anos = ee.List.sequence(anos_ini, anos_fim);  // Create list of years

  // Create annual image collection
  var anual = ee.ImageCollection(
    anos.map(function(y){

      var col_y = col.filter(ee.Filter.calendarRange(y, y, 'year'));  // Filter by year

      // Calculate either sum or mean based on configuration
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

  return anual.mean().multiply(vcfg.scale);  // Return climatology (mean of annual values) with scale correction
}

// =====================================================
// CREATE IMAGES FOR VISUALIZATION
// =====================================================

// Create an image for each variable
var imagens = {};
vars.forEach(function(v){
  imagens[v] = climatologia(v).clip(cz);  // Calculate climatology and clip to climate zone
});

// Add layers to map with appropriate color palettes
Map.addLayer(imagens.pr, {
  min: 1000,
  max: 2500,
  palette: ['blue', 'cyan', 'green', 'yellow', 'red']
}, 'Precipitation (mm)', false);

Map.addLayer(imagens.tmmx, {
  min: 20,
  max: 30,
  palette: ['blue', 'cyan', 'green', 'yellow', 'red']
}, 'Max Temp (°C)', false);

Map.addLayer(imagens.tmmn, {
  min: 10,
  max: 20,
  palette: ['blue', 'cyan', 'green', 'yellow', 'red']
}, 'Min Temp (°C)', false);

Map.addLayer(imagens.def, {
  min: 0,
  max: 500,
  palette: ['white', 'yellow', 'orange', 'red', 'brown']
}, 'Water Deficit (mm)', false);

Map.addLayer(imagens.pet, {
  min: 800,
  max: 1400,
  palette: ['yellow', 'orange', 'red', 'brown']
}, 'Potential Evapotranspiration (mm)', false);

Map.addLayer(imagens.ro, {
  min: 0,
  max: 1000,
  palette: ['white', 'blue', 'darkblue']
}, 'Runoff (mm)', false);

// =====================================================
// PIXEL-WISE SAMPLING
// =====================================================
var tabelaFinal = ee.FeatureCollection([]);  // Initialize empty feature collection for results

vars.forEach(function(v){

  var img = imagens[v];  // Get the image for this variable

  // Sample pixels at regular grid
  var samples = img.sample({
    region: cz_geom,
    scale: scale_m,      // 4km grid spacing
    geometries: true     // Include point geometries
  });

  // Add sampling points to map (only for first variable to avoid duplication)
  if (v === 'pr') {
    Map.addLayer(samples, {color: 'black'}, 'Sample points', false);
  }

  // Enrich attributes with location and administrative info
  samples = samples.map(function(f){

    var geom = f.geometry();
    var coords = geom.coordinates();

    var lon = coords.get(0);  // Longitude
    var lat = coords.get(1);  // Latitude

    // Find which municipality contains this point
    var muni = municipios.filterBounds(geom).first();

    var nome_muni = ee.Algorithms.If(
      muni,
      muni.get('ADM2_NAME'),  // Municipality name
      'NA'                     // 'NA' if not found
    );

    // State name (constant for this analysis)
    var nome_estado = 'Parana';

    return ee.Feature(null, {
      estado: nome_estado,     // State
      lat: lat,                // Latitude
      lon: lon,                // Longitude
      municipio: nome_muni,    // Municipality
      valor: f.get(v),         // Variable value
      variavel: v,             // Variable name
      ZC: zonaClimatica        // Climate zone ID
    });

  });

  tabelaFinal = tabelaFinal.merge(samples);  // Add to final collection

});

// Add climate zone boundary to map
Map.addLayer(cz, {color: 'red'}, 'Climate Zone', true);

// =====================================================
// EXPORT TO CSV
// =====================================================
Export.table.toDrive({
  collection: tabelaFinal,
  description: 'Pixels_ZC_' + zonaClimatica,  // Export filename
  fileFormat: 'CSV'
});
