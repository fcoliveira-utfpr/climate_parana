# climate_parana

Reproducible workflow for delineating and characterizing **agroclimatic zones (Global Yield Gap Atlas — GYGA methodology)** for the state of Paraná, Brazil, combining **Google Earth Engine (GEE)** processing with **Python** spatial analysis and visualization.

The code and data in this repository are part of the structuring and analysis behind the article **"Hydroclimatic and Thermal Characterization of Agroclimatic Zones in Paraná, Brazil: A Municipal-Scale Analysis"** (Fabrício Correia de Oliveira, Thais Vitoria Zanatta, Giseli de Cassia Serra, Anderson Sandro da Rocha, Leila Limberger — UTFPR/UNIOESTE).

## Overview

The workflow is organized in two complementary stages:

1. **Google Earth Engine (JavaScript)** — climate zone delineation, raster/vector processing, and municipality-level zonal statistics using TerraClimate and auxiliary assets (GADM, FAO/GAUL boundaries).
2. **Python (Jupyter/Colab notebooks)** — spatial characterization, statistical analysis, classification, and cartographic outputs based on the data exported from GEE.

## Repository structure

### Notebooks (Python)

| Notebook | Description |
|---|---|
| `01_area_of_study.ipynb` | Defines the study area (Paraná state and municipalities), loads climate zone data sources, and produces the summarized dataset used by climate zoning by municipality. |
| `02_characterization_and_spatial_variability_analysis.ipynb` | Spatial distribution of annual climatic variables by climate zone (ZC), boxplot analysis, hydroclimatic and thermal characterization, Principal Component Analysis (PCA), and mapping of variables by zone. |
| `03_climate_dominance_classification.ipynb` | Classification of climate dominance per municipality and general descriptive statistics. |
| `04_comparison_with_classical_climate.ipynb` | Comparison between GYGA climate zones and the classical (Köppen) climate classification, including comparative maps and statistical tests. |

All notebooks include a "Open in Colab" badge and are designed to run on Google Colab, with dependencies (`geobr`, `geopandas`, `rasterio`, `elevation`, `cartopy`, `matplotlib-scalebar`) installed at runtime.

### Google Earth Engine scripts (JavaScript)

| Script | Description |
|---|---|
| `GYGA_CZ_parana.js` | Loads the Paraná state boundary (FAO/GAUL) and the original GYGA Climate Zones feature collection. |
| `GYGA_parana_original.js` | Vectorization of the original GYGA climate zones over Paraná municipalities (GADM). |
| `GYGA_municipios.js` | Assigns the predominant climate zone (ZC) to each Paraná municipality from the rasterized GYGA classification. |
| `climate_clasifications.js` | Builds and inspects the municipality-level climate zone asset used across the analysis. |
| `elevation_pr.js` | Generates the elevation vector/raster layer for Paraná. |
| `map_CZ_6601.js` | Extracts and maps time-series climate data for an individual climate zone (parameterized by zone ID, year range, and spatial scale — e.g., zone 6601, 1991–2020, 4 km grid). |
| `maps_csv.js` | Extracts TerraClimate (1991–2020) variables for Paraná municipalities and exports them as CSV. |
| `zone_by_municipality.js` | Visualizes the final GYGA climate zone asset by municipality with the original zone color scheme. |

> Scripts are meant to be run in the [Google Earth Engine Code Editor](https://code.earthengine.google.com/), under the `projects/fcoliveira/assets/...` asset namespace referenced in the code.

### Data

| File | Description |
|---|---|
| `5901.csv`, `6601.csv`, `6701.csv`, `6801.csv`, `6901.csv`, `7501.csv`, `7601.csv`, `7701.csv`, `7801.csv`, `7901.csv` | Monthly time series (1991–2020) of climatic variables (e.g., `Ia` — Aridity/Moisture Index) with mean, min, max, and standard deviation, one file per GYGA climate zone (ZC code). |
| `dados_concatenados.csv` | Concatenated municipality-level values (e.g., climatic water deficit — `def`) with coordinates, for all Paraná municipalities. |
| `dados_concatenados_zc.csv` | Same as above, with the corresponding GYGA climate zone (`ZC`) assigned to each municipality. |
| `pr_classificacoes_climaticas_1991_2020_centroide.csv` | Municipality centroids (1991–2020) with Köppen classification (`KT`, `KT_nome`), thermal regime (`TH`, `TH_nome`), climate dominance (`CM`, `CM_nome`), and assigned GYGA zone (`ZC`), enabling the comparison performed in notebook 04. |

## Requirements

- Python ≥ 3.9
- `geobr`, `geopandas`, `rasterio`, `elevation`, `cartopy`, `matplotlib-scalebar`, `pandas`, `numpy`, `matplotlib`, `seaborn`, `scikit-learn`
- A Google Earth Engine account (for running the `.js` scripts) with access to the project asset namespace referenced in the scripts
- Recommended: Google Colab (notebooks are Colab-ready) or Jupyter Notebook/JupyterLab locally

Install Python dependencies:

```bash
pip install geobr geopandas rasterio elevation cartopy matplotlib-scalebar pandas numpy matplotlib seaborn scikit-learn
```

## Suggested workflow

1. Run the GEE scripts (`GYGA_CZ_parana.js` → `GYGA_municipios.js`/`GYGA_parana_original.js` → `climate_clasifications.js` → `maps_csv.js`) to generate and export the municipality/zone-level CSVs.
2. Run `01_area_of_study.ipynb` to define the study area and consolidate the summarized dataset.
3. Run `02_characterization_and_spatial_variability_analysis.ipynb` for spatial variability, boxplots, hydroclimatic/thermal characterization, and PCA.
4. Run `03_climate_dominance_classification.ipynb` for climate dominance classification and descriptive statistics.
5. Run `04_comparison_with_classical_climate.ipynb` to compare GYGA zones against the classical Köppen classification.

## Study area

The analysis focuses on the state of Paraná, Brazil, with particular attention to the western Paraná region (Santa Helena, Marechal Cândido Rondon, Toledo, Cascavel, Foz do Iguaçu, and neighboring municipalities).

## Related publication

**Hydroclimatic and Thermal Characterization of Agroclimatic Zones in Paraná, Brazil: A Municipal-Scale Analysis**
Fabrício Correia de Oliveira, Thais Vitoria Zanatta, Giseli de Cassia Serra, Anderson Sandro da Rocha, Leila Limberger

### Abstract

The state of Paraná, in southern Brazil, exhibits pronounced climatic diversity driven by latitude, altitude, and proximity to the Atlantic Ocean, affecting agricultural production and natural resource management. This study characterized and evaluated the agroclimatic zones defined by the Global Yield Gap Atlas (GYGA) for Paraná, using hydroclimatic and thermal variables derived from the TerraClimate dataset for the 1991–2020 climatological normal. Ten distinct climate zones (CZs) were identified across 399 municipalities in Google Earth Engine. Precipitation, potential evapotranspiration, climatic water deficit, water surplus, and mean maximum and minimum temperatures were analyzed, and an aridity index, annual thermal amplitude, and three climatic dominance indices were computed for each zone. Principal Component Analysis retained two components explaining 93.2% of total variance, showing clear separation among most CZs along hydric and thermal gradients. Thermal dominance prevailed in 68.5% of municipalities, concentrated in the north and west, while surplus-driven water dominance characterized 30.8% in the southern and eastern highlands. Validation against the Köppen–Trewartha, Camargo, and Thornthwaite systems yielded mean agreement rates of 82.7%, 85.0%, and 77.4%, respectively. The CZ framework effectively resolves transitional gradients, providing a sound basis for agricultural suitability assessment, sowing date planning, and climate risk management in Paraná.

**Keywords:** agroclimatic zoning, Global Yield Gap Atlas, TerraClimate, climatic water balance, principal component analysis, climate classification

## Citation

If you use this code or data, please cite the associated publication (full citation details — journal, volume, DOI — to be added upon publication).

## Author

Fabricio — UTFPR, Campus Santa Helena, PR, Brazil

## License

No license file is currently included. Add one (e.g., MIT, CC-BY-4.0) if you intend to allow reuse.
