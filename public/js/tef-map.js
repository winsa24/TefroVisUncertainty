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

  function drawVocalno(lat, lon){
    var diff = 0.05
    var latlngs = [
      [lat - diff, lon - diff],
      [lat - diff, lon + diff],
      [lat + diff, lon],
    ]
    var volcanIcon = L.polygon(latlngs, { color: 'grey', fillOpacity: 1 })
    return volcanIcon;
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
      // var latlngs = [
      //   [lat - diff, lon - diff],
      //   [lat - diff, lon + diff],
      //   [lat + diff, lon],
      // ]
      // var volcanIcon = L.polygon(latlngs, { color: 'grey', fillOpacity: 1 })
      var volcanIcon = drawVocalno(lat, lon)
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
    return map
  }

  // TODO::
  function getVolcanoCenter(){

  }

  function getPosWithin2Points(start, end, length){
    const angle = Math.atan2(end.lat - start.lat, end.lng - start.lng);
    const xOffset = Math.cos(angle) * length;
    const yOffset = Math.sin(angle) * length;
    return {'lat': start.lat + yOffset, 'lng': start.lng + xOffset}
  }

  var tails = [];
  function drawSampleTail(sampleArray){
    tails.forEach(function (item) {
      _mapContainer.removeLayer(item)
    });
    sampleArray.forEach((s)=>{
      const sampleCenter = s._latlng
      const volcanoBelongCenter = _volcanes[s.volcano]._latlngs[0][2]
      // if sample radius is [uncertainty] value
      const tailLength = s._mRadius / 20000
      const endTail = getPosWithin2Points(sampleCenter, volcanoBelongCenter, tailLength)
      
      let tail = L.polyline([sampleCenter, endTail], {color: '#000', weight: 1}) // longer line bigger distance to RL
        .addTo(_mapContainer)
        .on('click', function (e) {
          // interaction...
          // shiftViewport()
          // ...
        })   
      tails.push(tail)
      // use arrow : https://www.npmjs.com/package/leaflet-canvas-markers  ==> (can't change length) 
    })
  }

  function getStandardDeviation (array) {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }

  function drawVocalnoVirus(volcanName){
    const volcanoSamples = _samples[volcanName]

    let RLdistances = []
    volcanoSamples.forEach((s)=> {if(typeof(s.RLDistance)=='number') RLdistances.push(s.RLDistance)})

    const n = RLdistances.length
    const mean = RLdistances.reduce((a, b) => {return a + b}, 0) / n
    const stdd = Math.sqrt(RLdistances.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
    console.log(stdd)
 
    let stdd_1 = [], stdd_2_1 = [], stdd_2_2 = [], stdd_3_1 = [], stdd_3_2 = []
    volcanoSamples.forEach((s)=>{
      if(s.RLDistance > (mean - stdd) && s.RLDistance < (mean + stdd)) stdd_1.push(s);
      else if(s.RLDistance > (mean - stdd*2) && s.RLDistance < (mean - stdd) ) stdd_2_1.push(s);
      else if(s.RLDistance > (mean + stdd) && s.RLDistance < (mean + stdd*2)) stdd_2_2.push(s);
      else if(s.RLDistance < mean - stdd*2) stdd_3_1.push(s);
      else stdd_3_2.push(s);
    })

    const vol_latlngs = _volcanes[volcanName]._latlngs[0][2]
    var circle_std1 = L.circle(vol_latlngs, {radius: stdd_1.length * 10, color: "#000"})
      .addTo(_mapContainer)
      .on('click', function (e) {
        console.log(stdd_1)
        volcanoSamples.forEach((s)=>s.setStyle({color:_volcanes[volcanName].color}))
        stdd_1.forEach((s)=>s.setStyle({color:"#F00"}))
        drawSampleTail(stdd_1)
      })
    // 1 std
    const stdmap = stdd * 2
    const vol_latlng_std2_1 = {'lat' : vol_latlngs.lat, 'lng': vol_latlngs.lng - stdmap}
    const vol_latlng_std2_2 = {'lat' : vol_latlngs.lat, 'lng': vol_latlngs.lng + stdmap}
    let circle_std2_1 = L.circle(vol_latlng_std2_1, {radius: stdd_2_1.length * 10, color: '#000'})
      .addTo(_mapContainer)
      .on('click', function (e) {
        volcanoSamples.forEach((s)=>s.setStyle({color:_volcanes[volcanName].color}))
        stdd_2_1.forEach((s)=>s.setStyle({color:"#F00"}))
        drawSampleTail(stdd_2_1)
        console.log(stdd_2_1)
      })
    let circle_std2_2 = L.circle(vol_latlng_std2_2, {radius: stdd_2_2.length * 10, color: '#000'})
      .addTo(_mapContainer)
      .on('click', function (e) {
        volcanoSamples.forEach((s)=>s.setStyle({color:_volcanes[volcanName].color}))
        stdd_2_2.forEach((s)=>s.setStyle({color:"#F00"}))
        drawSampleTail(stdd_2_2)
        console.log(stdd_2_2)
      })
    let line_std2_1 = L.polyline([vol_latlngs, vol_latlng_std2_1], {color: '#000'}).addTo(_mapContainer);
    let line_std2_2 = L.polyline([vol_latlngs, vol_latlng_std2_2], {color: '#000'}).addTo(_mapContainer);
    // 2 std
    const vol_latlng_std3_1 = {'lat' : vol_latlngs.lat, 'lng': vol_latlngs.lng - stdmap*2}
    const vol_latlng_std3_2 = {'lat' : vol_latlngs.lat, 'lng': vol_latlngs.lng + stdmap*2}
    L.circle(vol_latlng_std3_1, {radius: stdd_3_1.length * 10, color: '#000'})
      .addTo(_mapContainer)
      .on('click', function (e) {
        console.log(stdd_3_1)
        volcanoSamples.forEach((s)=>s.setStyle({color:_volcanes[volcanName].color}))
        stdd_3_1.forEach((s)=>s.setStyle({color:"#F00"}))
        drawSampleTail(stdd_3_1)
      })
    L.circle(vol_latlng_std3_2, {radius: stdd_3_2.length * 10, color: '#000'})
      .addTo(_mapContainer)
      .on('click', function (e) {
        console.log(stdd_3_2)
        volcanoSamples.forEach((s)=>s.setStyle({color:_volcanes[volcanName].color}))
        stdd_3_2.forEach((s)=>s.setStyle({color:"#F00"}))
        drawSampleTail(stdd_3_2)
      })
    L.polyline([vol_latlng_std2_1, vol_latlng_std3_1], {color: '#000'}).addTo(_mapContainer);
    L.polyline([vol_latlng_std2_2, vol_latlng_std3_2], {color: '#000'}).addTo(_mapContainer);
  }

  function drawSamplesBorder(volcanName){
    const volcanoSamples = _samples[volcanName]
    const groundTruthSamples = volcanoSamples.filter(obj => {
      return (obj.typeOfRegister === 'Effusive material') || (obj.typeOfRegister === 'Pyroclastic material' && obj.TypeOfAnalysis === 'Bulk');
    });
    const volcanIcon = _volcanes[volcanName]
    let latlnge = [], lats= [], lngs= []
    
    groundTruthSamples.forEach((s) =>{ 
      latlnge.push(s._latlng)
      lats.push(s._latlng.lat)
      lngs.push(s._latlng.lng)
    })
    const lataverage = lats.reduce((a, b) => a + b) / lats.length;
    const lngaverage = lngs.reduce((a, b) => a + b) / lngs.length;
    // console.log(lataverage, lngaverage)
    // let groundTruthSamplesPolygon = L.polygon(latlnge, { color: "#000", weight: 1, opacity: 0.2 }).addTo(_mapContainer);  
    // var newCircle = L.circle([lataverage, lngaverage], { radius: 200000, color: "#000", fillColor: volcanIcon.color, fill: true }) 
   
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
      drawVocalnoVirus(volcan)
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
      var newCircle = L.circle([lat, lon], { radius: m.sample_RMSE_to_regression?m.sample_RMSE_to_regression * 2000: 200, color: volcanIcon.color, fillColor: volcanIcon.color, weight: m.SampleObservation_distance_to_regression?m.SampleObservation_distance_to_regression * 5:1, fill: true })
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
      newCircle.RLDistance = m.sample_RMSE_to_regression
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
