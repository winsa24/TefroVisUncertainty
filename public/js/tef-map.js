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
      if(zoomLevel <= 3) bins = 2;
      else if(zoomLevel > 3 && zoomLevel <= 6) bins = 10;
      else if(zoomLevel > 6 && zoomLevel <= 8) bins = 20;
      else if(zoomLevel > 8 && zoomLevel <= 10) bins = 50;
      else bins = 100;
  
      removeOldIms()
      addNewIms()
    })

    _volcanes = {}
    _samples = {}
    return map
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
      let lat = Number(volcan._latlng.lat) + 0.12
      let lon =  Number(volcan._latlng.lng) + 0.2
      var diff = 0.05

      var imageUrl = `/img/heatmap_${bins}_viridis_r/${volcanName}.png`
      if(['Huanquihue Group', 'Carrán-Los Venados', 'Yanteles', 'Viedma'].indexOf(volcanName) >= 0)  imageUrl = `/img/blank.png`
      if(['Puntiagudo', 'Tronador', 'Arenales', 'Aguilera', 'Reclus', 'Fueguino', 'Monte Burney'].indexOf(volcanName) >= 0)  imageUrl = `/img/blank.png`
      var imageBounds = [[lat + diff * 2, lon + diff * 4], [lat - diff * 2, lon - diff * 4]]
      let volcanIm = L.imageOverlay(imageUrl, imageBounds, {alt: `no plot for ${volcanName}`}).addTo(_mapContainer)
      volcanIms.push(volcanIm)
    }
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

      // var volcanIcon = L.polygon(latlngs, { color: 'grey', fillOpacity: 0.7, opacity: 0.7 })
      let latLng = L.latLng(lat, lon)
      var volcanIcon = L.triangleMarker(latLng, {
        rotation: 0,
        width: 20,
        height: 20,
        color: volcan.Color,
        fillColor: volcan.Color
      })

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
      _volcanes[volcan.Name] = volcanIcon
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
