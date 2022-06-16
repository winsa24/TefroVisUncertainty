import { sampleTipText } from './tef-utils.js'


export default function map() {
  var map = {}
  var _mapContainer
  var _volcanes
  var _samples
  var _tef

  let bins = 10;

  // INITIALIZATION
  map.init = function (tef) {

    _tef = tef
    const mbAttr =
      'Map data &copy <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>'
    const mbUrl =
      'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'

    const grayscale = L.tileLayer(mbUrl, {
      id: 'mapbox/light-v9',
      tileSize: 512,
      zoomOffset: -1,
      attribution: mbAttr,
    })
    _mapContainer = L.map('volcanoMap').setView([-45, -71.489618], 6)
    grayscale.addTo(_mapContainer)
    L.control.scale().addTo(_mapContainer)
    _mapContainer.on('zoomend',function(e){
      console.log(_mapContainer.getZoom())
      let zoomLevel = _mapContainer.getZoom()
      if(zoomLevel <= 7) bins = 10;
      else if(zoomLevel > 7 && zoomLevel <= 9) bins = 20;
      else if(zoomLevel > 9 && zoomLevel <= 10) bins = 50;
      else bins = 100;
  
      removeOldIms()
      addNewIms()
    })

    _volcanes = {}
    _samples = {}
    return map
  }

  function drawRLPathRect(){
    // only draw on selected volcanoes 
    // loop
    // volcan is one in the loop 
    console.log(_volcanes)
    let volcan = _volcanes.Llaima
    console.log(volcan)
    var lat = Number(volcan._bounds._northEast.lat)
    var lon = Number(volcan._bounds._northEast.lng)
    var diff = 0.05

    // steep doesn't align
    let origin = {y: lat - diff/2, x: lon - diff * 4} // longitude => x axis, latitude => y axis
    let scalek = 0.01

    let effusiveFitCase = ['Case 1', 'Case 2', 'Case 3', 'Case 6', 'Case 7', 'Case 8.1']
    const match = effusiveFitCase.find(element => {
      if (element.includes(volcan.fit_case)) {
        return true;
      }
    });
    console.log(match)
    let length = 50
    let k = (volcan.effusive_regression_b == -1 || !volcan.effusive_regression_b)? 0 : volcan.effusive_regression_b
    let b = (volcan.effusive_regression_a == -1 || !volcan.effusive_regression_a)? 0 : volcan.effusive_regression_a
    
    let angle = Math.atan(k)
    let x1 = 0
    let y1 = b
    let x2 = length * Math.cos(angle)
    let y2 = length * Math.sin(angle) + b
    

    var latlngs_line = [
      [origin.y + y1 * scalek * 3, origin.x + x1 * scalek],
      [origin.y + y2 * scalek * 3, origin.x + x2 * scalek]
    ]
    let offset = 0.5
    var bounds = [
      [origin.y + y1 * scalek * 3, origin.x + x1 * scalek],
      [origin.y + y1 * scalek * 3 - offset, origin.x + x1 * scalek + offset],
      [origin.y + y2 * scalek * 3 - offset, origin.x + x2 * scalek + offset],
      [origin.y + y2 * scalek * 3, origin.x + x2 * scalek],
    ];

    L.polygon(bounds, {color: volcan.color, weight: 1}).addTo(_mapContainer);
    // var polylineEffu = L.polyline(latlngs_line, {color: volcan.color, opacity: 0.7, width: '100px'}).addTo(_mapContainer);
    
    let k_bulk = (volcan.bulk_pyroclastic_regression_b == -1 || !volcan.bulk_pyroclastic_regression_b)? 0 : volcan.bulk_pyroclastic_regression_b
    let b_bulk = (volcan.bulk_pyroclastic_regression_a == -1 || !volcan.bulk_pyroclastic_regression_a)? 0 : volcan.bulk_pyroclastic_regression_a
    let angle_bulk = Math.atan(k_bulk)
    let x1_bulk = 0
    let y1_bulk = b_bulk
    let x2_bulk = length * Math.cos(angle_bulk)
    let y2_bulk = length * Math.sin(angle_bulk) + b_bulk
    // let y2_bulk = k_bulk>0? y1_bulk + length_bulk * Math.cos(angle_bulk): y1_bulk - length * Math.cos(angle_bulk)
    
    var latlngs_line_bulk = [
      [origin.y + y1_bulk * scalek, origin.x + x1_bulk * scalek],
      [origin.y + y2_bulk * scalek, origin.x + x2_bulk * scalek]
    ]
    // var polylineBulk = L.polyline(latlngs_line_bulk, {color: volcan.color, opacity: 0.3}).addTo(_mapContainer);




  }
  
  let volcanIms = []
  function removeOldIms(){
    volcanIms.forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
  }
  function addNewIms(){
    console.log(_volcanes)
    for (const [volcanName, volcan] of Object.entries(_volcanes)) {
      // [0.12, 0.2]=> put image org at the triangle top
      // let lat = Number(volcan._latlng.lat) + 0.12
      // let lon =  Number(volcan._latlng.lng) + 0.2
      var lat = Number(volcan._bounds._northEast.lat)
      var lon = Number(volcan._bounds._northEast.lng)
      var diff = 0.05

      var imageUrl = `/img/heatmap_${bins}_r/${volcanName}.png`
      if(['Huanquihue Group', 'Carrán-Los Venados', 'Yanteles', 'Viedma'].indexOf(volcanName) >= 0)  imageUrl = `/img/scatter_plots_fillPolygon_RLcase_allCluster_allgrayscale/Corcovado.png`
      if(['Puntiagudo', 'Tronador', 'Arenales', 'Aguilera', 'Reclus', 'Fueguino', 'Monte Burney'].indexOf(volcanName) >= 0)  imageUrl = `/img/scatter_plots_fillPolygon_RLcase_allCluster_allgrayscale/Corcovado.png`
      var imageBounds = [[lat + diff * 2, lon + diff * 4], [lat - diff * 2, lon - diff * 4]]
      let volcanIm = L.imageOverlay(imageUrl, imageBounds, {alt: `no plot for ${volcanName}`}).addTo(_mapContainer)
      volcanIms.push(volcanIm)
    }
    drawRLPathRect()
  }
  map.addVolcanoes = function (volcanes) {
    volcanes.forEach(function (volcan, i) {
      var lat = Number(volcan.Latitude)
      var lon = Number(volcan.Longitude)
      var volcanTip = '<div id=' + volcan.Name + '>'
      volcanTip += '<h4>' + volcan.Name + '</h4>'
      volcanTip += '<h4>(' + [lat, lon] + ')</h4>'
      volcanTip += '</div>'
      var diff = 0.05
      var latlngs = [
        [lat - diff, lon - diff],
        [lat - diff, lon + diff],
        [lat + diff, lon],
      ]
      var volcanIcon = L.polygon(latlngs, { color: 'grey', fillOpacity: 0.7, opacity: 0.7 })
      // let latLng = L.latLng(lat, lon)
      // var volcanIcon = L.triangleMarker(latLng, {
      //   rotation: 0,
      //   width: 20,
      //   height: 20,
      //   color: volcan.Color,
      //   fillColor: '#525252'
      // })

      volcanIcon.id = volcan.Name
      volcanIcon.color = volcan.Color
      volcanIcon.isSelected = false
      volcanIcon
        .addTo(_mapContainer)
        .bindPopup(volcanTip)
        .on('click', function (e) {
          var id = e.target.id
          _tef.selectVolcano(id, true)
        })
      volcanIcon.on('mouseover', function (e) {
        this.openPopup()
      })
      volcanIcon.on('mouseout', function (e) {
        this.closePopup()
      })

      // scatter + cluster + border => `/img/scatter_plots_ border/${volcan.Name}.png`
      // scatter + cluster + fill(alpha) => `scatter_plots_fill_border_alpha_sp`
      // cluster + fill => `scatter_plots_fill_border_alpha_nsp`
      // scatter + cluster + fill(solid) => `scatter_plots_fill_border_solid`
      // scatter + cluster + fill(alpha = norm(sample number) ) => `scatter_plots_fill_border_alpha_sp_notr`
      // scatter + cluster + fill(alpha = norm(sample number/area) )=> `scatter_plots_fill_border_alpha_sp_noareatr`
      // scatter(GT) + cluster(in 3 group) + fill(alpha) + RL + info + white bgk => `/img/scatter_plots_fillPolygon_RL_info_whitebgk/${volcan.Name}_trend.png`
      // scatter(GT) + cluster(in 3 group) + fill(alpha) + RL => `/img/scatter_plots_fillPolygon_RL/${volcan.Name}_trend.png`
      // scatter(GT) + cluster + fill(alpha) + RL => `/img/scatter_plots_fillPolygon_RL_allCluster/${volcan.Name}_trend.png`

      // cluster + fill(grayscale(allsampleNumbers)) + border(Color) + RL(1 wrt case) => `/img/scatter_plots_fillPolygon_RLcase_allCluster_allgrayscale/${volcan.Name}.png`
      // cluster + fill(alpha) + RL(1 wrt case) => `/img/scatter_plots_fillPolygon_RLcase_allCluster/${volcan.Name}.png`
      // cluster(on 3 group) + fill(alpha) + RL(1 wrt case) =>  `/img/scatter_plots_fillPolygon_RLcase_groupCluster/${volcan.Name}.png`
      // group + fill(alpha) + RL(1 wrt case) =>  `/img/scatter_plots_fillPolygon_RLcase_group/${volcan.Name}.png`
      // group + fill(grayscale(allsampleNumbers)) + RL(1 wrt case) =>  `/img/scatter_plots_fillPolygon_RLcase_group/${volcan.Name}.png`
      // heatmap => heatmap
      // scatter(glass) + cluster + fill(alpha) + RL(1 wrt case) => `/img/scatter_plots_fillPolygon_RLcase_allCluster_scatterGlass/${volcan.Name}.png`
      _volcanes[volcan.Name] = volcanIcon
      _volcanes[volcan.Name].effusive_regression_b = volcan.effusive_regression_b
      _volcanes[volcan.Name].effusive_regression_a = volcan.effusive_regression_a
      _volcanes[volcan.Name].effusive_regression_SampleNumber = volcan.effusive_regression_SampleNumber
      _volcanes[volcan.Name].bulk_pyroclastic_regression_b = volcan.bulk_pyroclastic_regression_b
      _volcanes[volcan.Name].bulk_pyroclastic_regression_a = volcan.bulk_pyroclastic_regression_a
      _volcanes[volcan.Name].bulk_pyroclastic_regression_SampleNumber = volcan.bulk_pyroclastic_regression_SampleNumber
      _volcanes[volcan.Name].fit_case = volcan.fit_case
      _samples[volcan.Name] = []
    })
    addNewIms()
    return map
  }

  // UPDATES AFTER USER SELECTION
  map.updateSelectedVolcano = function (volcan, isSelected, samples) {
    const volcanIcon = _volcanes[volcan]
    if (!isSelected) {
      volcanIcon.setStyle({
        color: volcanIcon.color,
        fillColor: 'gray',
        fill: true,
        stroke: false
      })
      removeSamples(volcan)
    } else {
      volcanIcon.setStyle({
        color: volcanIcon.color,
        fillColor: volcanIcon.color,
        fill: true,
        stroke: true
      })
      addSamples(volcan, samples)
    }
    return volcanIcon.selected
  }
  map.updateSelectedEvents = function (volcan, eventos) {
    const markers = _samples[volcan]
    const type = d3.selectAll('.scatter-view:checked').node().value
    markers.forEach((m) => {
      const selected = (eventos.indexOf(m.event) >= 0 && m.event != 'Unknown')
      if (type == 'selected' && !selected) {
        m.isVisible = false
        _mapContainer.removeLayer(m)
      } else {
        if (!m.isVisible){
          m.isVisible = true
          m.addTo(_mapContainer)
        }        
      }
    })
  }
  map.updateSelectedSamples = function (_selectedVolcanoes) {
    for (let volcan in _selectedVolcanoes) {
      map.updateSelectedEvents (volcan, _selectedVolcanoes[volcan].events)
    }
  }
  function addSamples(volcan, samples) {
    const volcanIcon = _volcanes[volcan]
    samples.forEach(function (m) {
      var lat = m.Latitude
      var lon = m.Longitude
      console.log(m)
      var newCircle = L.circle([lat, lon], { radius: m.sample_RMSE_to_regression?m.sample_RMSE_to_regression * 2000: 200, color: volcanIcon.color, fillColor: volcanIcon.color, weight: 1, fill: true }) 
      // var newCircle = L.circle([lat, lon], { radius: 200, color: volcanIcon.color, fillColor: volcanIcon.color, weight: m.SampleObservation_distance_to_regression?m.SampleObservation_distance_to_regression * 10:1, fill: true })
      var tipText = sampleTipText(m)
      newCircle
        .addTo(_mapContainer)
        .bindPopup(tipText)
        .on('mouseover', function (e) {
          this.openPopup()
        })
        .on('mouseout', function (e) {
          this.closePopup()
        })
      newCircle.event = m.Event
      newCircle.volcano = m.Volcano
      newCircle.isVisible = true
      _samples[m.Volcano].push(newCircle)
    })
  }
  function removeSamples(volcan) {
    _samples[volcan].forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
  }
  return map
}
