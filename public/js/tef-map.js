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
  map.addVolcanoes = function (volcanes) {
    volcanes.forEach(function (volcan, i) {
      var lat = Number(volcan.Latitude)
      var lon = Number(volcan.Longitude)
      var volcanTip = '<div id=' + volcan.Name + '>'
      volcanTip += '<h4>' + volcan.Name + '</h4>'
      volcanTip += '<h4>(' + [lat, lon] + ')</h4>'
      volcanTip += '</div>'
      var diff = 0.05
      var bounds = [
        [lat - diff, lon - diff],
        [lat + diff, lon + diff*2],
      ];
      L.rectangle(bounds, {color: "#36454F", weight: 1, fillOpacity:0.1, opacity: 0.3}).addTo(_mapContainer);
      
      console.log(volcan)

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

      let origin = {y: lat, x: lon - diff} // longitude => x axis, latitude => y axis
      let scalek = 0.01

      let k = (volcan.effusive_regression_b == -1 || !volcan.effusive_regression_b)? 0 : volcan.effusive_regression_b
      let b = (volcan.effusive_regression_a == -1 || !volcan.effusive_regression_a)? 0 : volcan.effusive_regression_a
      let length = (volcan.effusive_regression_SampleNumber == -1 || !volcan.effusive_regression_SampleNumber)? 0 : volcan.effusive_regression_SampleNumber
      let angle = Math.atan(k)
      let x1 = 0
      let y1 = b
      let x2 = length * Math.cos(angle)
      let y2 = length * Math.sin(angle) + b


      var latlngs_line = [
        [origin.y + y1 * scalek, origin.x + x1 * scalek],
        [origin.y + y2 * scalek, origin.x + x2 * scalek]
      ]
      var polylineEffu = L.polyline(latlngs_line, {color: volcan.Color, opacity: 0.7}).addTo(_mapContainer);

      
      let k_bulk = (volcan.bulk_pyroclastic_regression_b == -1 || !volcan.bulk_pyroclastic_regression_b)? 0 : volcan.bulk_pyroclastic_regression_b
      let b_bulk = (volcan.bulk_pyroclastic_regression_a == -1 || !volcan.bulk_pyroclastic_regression_a)? 0 : volcan.bulk_pyroclastic_regression_a
      let length_bulk = (volcan.bulk_pyroclastic_regression_SampleNumber == -1 || !volcan.bulk_pyroclastic_regression_SampleNumber)? 0 : volcan.bulk_pyroclastic_regression_SampleNumber
      let angle_bulk = Math.atan(k_bulk)
      let x1_bulk = 0
      let y1_bulk = b_bulk
      let x2_bulk = length_bulk * Math.cos(angle_bulk)
      let y2_bulk = length_bulk * Math.sin(angle_bulk) + b_bulk
      // let y2_bulk = k_bulk>0? y1_bulk + length_bulk * Math.cos(angle_bulk): y1_bulk - length_bulk * Math.cos(angle_bulk)
      
      var latlngs_line_bulk = [
        [origin.y + y1_bulk * scalek, origin.x + x1_bulk * scalek],
        [origin.y + y2_bulk * scalek, origin.x + x2_bulk * scalek]
      ]
      var polylineBulk = L.polyline(latlngs_line_bulk, {color: volcan.Color, opacity: 0.3}).addTo(_mapContainer);


      _volcanes[volcan.Name] = volcanIcon
      _samples[volcan.Name] = []
    })
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
