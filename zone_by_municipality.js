// =====================================================
// VISUALIZAÇÃO DO ASSET GYGA
// CORES ORIGINAIS + TRATAMENTO DE ERRO
// =====================================================

// 1. Carregar asset final
var municipiosGyga = ee.FeatureCollection(
  'projects/fcoliveira/assets/CZ/zonas_climaticas'
);

// 2. Lista ordenada de zonas (igual ao processamento)
var czList = municipiosGyga
  .aggregate_array('GYGA_CZ')
  .distinct()
  .sort();

// 3. Paleta HEX ORIGINAL (mesma ordem)
var gygaPaletteHex = ee.List([
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
]);

// 4. Estilo automático com proteção
var municipiosStyled = municipiosGyga.map(function(f) {

  // Garante número válido
  var cz = ee.Number(f.get('GYGA_CZ'));

  // Índice da classe
  var idx = czList.indexOf(cz);

  // Se idx < 0 → cor cinza
  var color = ee.Algorithms.If(
    idx.gte(0),
    gygaPaletteHex.get(idx.mod(gygaPaletteHex.length())),
    'BDBDBD' // cinza para casos sem zona
  );

  return f.set('style', {
    color: '000000',   // contorno preto
    width: 1,
    fillColor: ee.String(color)
  });

}).style({styleProperty: 'style'});

// 5. Visualização
Map.centerObject(municipiosGyga, 7);
Map.addLayer(municipiosStyled, {}, 'GYGA – Municípios (cores originais)');

// 6. Diagnóstico (opcional, mas útil)
print('GYGA_CZ usados:', czList);
print(
  'Municípios sem GYGA_CZ:',
  municipiosGyga.filter(ee.Filter.lt('GYGA_CZ', 0))
);
