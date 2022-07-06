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
    })
    return map
  }

  function getPosWithin2Points(start, end, length){
    const angle = Math.atan2(end.lat - start.lat, end.lng - start.lng);
    const xOffset = Math.cos(angle) * length;
    const yOffset = Math.sin(angle) * length;
    return {'lat': start.lat + yOffset, 'lng': start.lng + xOffset}
  }

  const volcanNameList = ['Llaima','Sollipulli','Caburga_Huelemolle','Villarrica','Quetrupillán','Lanín','Mocho_Choshuenco','Puyehue_Cordón_Caulle','Antillanca_Casablanca','Osorno','Calbuco','Yate','Apagado','Hornopirén','Huequi','Michinmahuida','Chaitén','Corcovado','Melimoyu','Mentolat','Cay','Macá','Hudson','Lautaro','Aguilera','Reclus','Monte_Burney']

  function mapTailLength (value, oldRange, newRange) { // newRange : [2,1]

    let perc = (value - oldRange[0]) / (oldRange[1] - oldRange[0])
    let newValue = (newRange[0] - newRange[1]) * perc + newRange[1]
    return newValue;
  }

  var tails = [];
  function drawSampleTail(sampleArray,threshold = 0.01){
    tails.forEach(function (item) {
      _mapContainer.removeLayer(item)
    });
    // tail on assigned volcano
    sampleArray.forEach((s)=>{
      const sampleCenter = s._latlng
      const volcanoBelongCenter = _volcanes[s.volcano]._latlngs[0][2]
      // if sample radius is [uncertainty] value
      const assVolcano = volcanNameList.filter(v => v.substring(0,3) === s.volcano.substring(0,3))
      const sampleObsDis = s.distoAllVolcan[assVolcano]
      if(sampleObsDis != null && sampleObsDis > 0 ){
        const tailLength = mapTailLength(sampleObsDis, [0,5.529976584], [0.5,0]) // TODO:: scale
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
      }
    })
    // fake tail to other volcano
    sampleArray.forEach((s)=>{
      const sampleCenter = s._latlng
      const disToAll = s.distoAllVolcan
      const potentialVolcanoes = Object.keys(disToAll).filter(key => disToAll[key] < threshold)
      potentialVolcanoes.forEach(v=>{
        let volcanoName= v.replaceAll("_", "-")
        switch(volcanoName){
          case "Monte-Burney" : volcanoName = "Monte Burney"; break
          case "Puyehue-Cordón-Caulle": volcanoName = "Puyehue-Cordón Caulle"; break;
        }
        const assVolcano = _volcanes[volcanoName]
        const volcanoBelongCenter = assVolcano._latlngs[0][2]
        // if sample radius is [uncertainty] value
        if(disToAll[v] != null && disToAll[v] > 0 ){
          const tailLength = mapTailLength(disToAll[v], [0,threshold], [0.5,0]) // TODO:: scale
          console.log(tailLength)
          const endTail = getPosWithin2Points(sampleCenter, volcanoBelongCenter, tailLength)
          
          let tail = L.polyline([sampleCenter, endTail], {color: assVolcano.color, weight: 1}) // longer line bigger distance to RL
            .addTo(_mapContainer)
            .on('click', function (e) {
              // interaction...
              // shiftViewport()
              // ...
            })   
          tails.push(tail)
        }
        
      })
      
      // use arrow : https://www.npmjs.com/package/leaflet-canvas-markers  ==> (can't change length) 
    })
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
      drawSampleTail(_samples[volcan])
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
      newCircle.distoAllVolcan = {
        Llaima : m.Llaima,
        Sollipulli :  m.Sollipulli,
        Caburga_Huelemolle :  m.Caburga_Huelemolle,
        Villarrica :  m.Villarrica,
        Quetrupillán:  m.Quetrupillán,
        Lanín :  m.Lanín,
        Puyehue_Cordón_Caulle : m.Puyehue_Cordón_Caulle,
        Antillanca_Casablanca :  m.Antillanca_Casablanca,
        Osorno:  m.Osorno,
        Calbuco:  m.Calbuco,
        Yate : m.Yate,
        Hornopirén:  m.Hornopirén,
        Huequi: m.Huequi,
        Michinmahuida:  m.Michinmahuida,
        Chaitén:  m.Chaitén,
        Corcovado: m.Corcovado,
        Melimoyu:  m.Melimoyu,
        Mentolat:  m.Mentolat,
        Cay:  m.Cay,
        Macá: m.Macá,
        Hudson:  m.Hudson,
        Lautaro:  m.Lautaro,
        Aguilera: m.Aguilera,
        Reclus:  m.Reclus,
        Monte_Burney:  m.Monte_Burney,
        Apagado:m.Apagado,
        Mocho_Choshuenco: m.Mocho_Choshuenco
      }
        
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
