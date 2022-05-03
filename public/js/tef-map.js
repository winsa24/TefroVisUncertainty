import { sampleTipText } from './tef-utils.js'


export default function map() {
  var map = {}
  var _mapContainer
  var _volcanes
  var _samples
  var _tef

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
    _volcanes = {}
    _samples = {}
    return map
  }
  
  // UPDATES AFTER USER SELECTION
  map.updateSelectedVolcano = function (volcan, isSelected, samples, isLoaded = false) {
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
        color: isLoaded? 'gray' : volcanIcon.color,
        fillColor: isLoaded? 'gray' :volcanIcon.color,
        fill: true,
        stroke: true
      })
      addSamples(volcan, samples, isLoaded)
    }
    return volcanIcon.selected
  }

  map.addVolcanoes = function (volcanes, samples) {
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
      var volcanIcon = L.polygon(latlngs, { color: 'grey', fillOpacity: 1 })
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
      // pre-load samples
      let rawSamples = []
      samples.forEach((s)=>{
        if(s.Volcano == volcan.Name){
          rawSamples.push(s)
        }
      })
      map.updateSelectedVolcano(volcan.Name, true, rawSamples, true)
    })
    return map
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
  function addSamples(volcan, samples, isLoaded) {
    const volcanIcon = _volcanes[volcan]
    samples.forEach(function (m) {
      if(isLoaded) {
        var lat = m.Latitude
        var lon = m.Longitude
        var newCircle = L.circle([lat, lon], { radius: m.sample_RMSE_to_regression? m.sample_RMSE_to_regression * 2000 : 200, color: 'gray' , fillColor: 'gray' , weight: 1, fill: true, opacity: 0.3, fillOpacity: 0.3 })
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
        newCircle.typeOfRegister = m.TypeOfRegister
        newCircle.TypeOfAnalysis = m.TypeOfAnalysis
        newCircle.isVisible = true
        newCircle.RLDistance = m.sample_RMSE_to_regression
        _samples[m.Volcano].push(newCircle)
      }else{
        _samples[m.Volcano].forEach((circle) =>{
          circle.setStyle({
            radius: circle.RLDistance?circle.RLDistance * 2000: 200,
            weight: circle.RLDistance?circle.RLDistance * 10: 1,
            color: volcanIcon.color,
            fillColor: volcanIcon.color,
            opacity: 0.3,
            fillOpacity: 0.5
          })
        })
      }

    })
  }
  function removeSamples(volcan) {
    _samples[volcan].forEach(function (m) {
      m.setStyle({
        radius: 200,
        weight: 1,
        color: 'gray',
        fillColor: 'gray',
        opacity: 0.3,
        fillOpacity: 0.3
      })
      // _mapContainer.removeLayer(m)
    })
  }
  return map
}
