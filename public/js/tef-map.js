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
      if(!isLoaded) drawVocalnoGlyphs(volcan)
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
    const std = Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
    return [mean, std]
  }

  // use standard deviation as critiria 
  function groupSamples(samples, std, mean){
    let group1 = [], group2 = [], group3 = []
    samples.forEach((s)=>{
      if(s.RLDistance < (mean + std)) group1.push(s);
      else if(s.RLDistance > (mean + std) && s.RLDistance < (mean + std*2)) group2.push(s);
      else group3.push(s);
    })
    return Array(group1, group2, group3)
  }

  function groupSamplesbyPercentage(){
    let group1 = [], group2 = []
    var slider = document.getElementById("myRange");
    var output = document.getElementById("demo");

    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
      output.innerHTML = this.value; 

      allsampleGroups.forEach((volcanoGroup) => {
        const volcanName = volcanoGroup['volcanName']
        const samples = _samples[volcanName]
  
        const sortedsamples = samples.sort((a, b) => {
          return a.RLDistance - b.RLDistance;
        });
        
        output.innerHTML = slider.value; // Display the default slider value

        const slicePoint = this.value/100 * sortedsamples.length
        group1 = sortedsamples.slice(0, slicePoint)
        group2 = sortedsamples.slice(slicePoint)

        allsampleGroups.forEach((volcanoGroup)=>{
          if(volcanoGroup['volcanName'] == sortedsamples[0].volcano) volcanoGroup['data'] =  Array(group1, group2)
        })    
      })
      drawGlyph(allsampleGroups, null, this.value) // TODO:: draw all the grouped samples ::xian (sampleGroups => xxx)
    }
    return [Array(group1, group2), slider.value]
  }

  let glyphs = []
  function drawGlyph(allsampleGroups, std, pct){
    allsampleGroups.forEach((sg)=>{
      const volcanName = sg['volcanName']
      const sampleGroups = std ? sg['stdGroups'] : sg['data']
      const stdValue = sg['stdValue'] ? sg['stdValue'] : 0.1
      // remove glyph of same volcano
      glyphs.forEach(function (item) {
        if(item.options.volcan == volcanName) _mapContainer.removeLayer(item)
      });

      const vol_latlngs = _volcanes[volcanName]._latlngs[0][2]
      for(let i = 0; i < sampleGroups.length; i ++){
        let stdmap = 0
        if(std) stdmap = (i == 0 ? 0 : stdValue * (i+1))
        if(pct) stdmap = (i == 0 ? 0 : pct/100 * 0.5)
        
        const circleLatlng = {'lat' : vol_latlngs.lat, 'lng': vol_latlngs.lng + stdmap}
        const circle = L.circle(circleLatlng, {radius: sampleGroups[i].length * 10, color: "#000", volcan: volcanName})
          .addTo(_mapContainer)
          .on('click', function (e) {
            sampleGroups.forEach((group) => { group.forEach((s)=>s.setStyle({color:_volcanes[volcanName].color}))})
            sampleGroups[i].forEach((s)=>s.setStyle({color:"#F00"}))
            drawSampleTail(sampleGroups[i])
          })
        const line = L.polyline([vol_latlngs, circleLatlng], {color: '#000', volcan: volcanName}).addTo(_mapContainer)
        glyphs.push(circle)
        glyphs.push(line)
      }
    })
    
  }

  // TODO : draw glyph on all selected volcanoes
  let allsampleGroups = [] // TODO:: save that grouped samples somewhere. save all the grouped samples of selected volcanoes
  function drawVocalnoGlyphs(volcanName){
    const volcanoSamples = _samples[volcanName]

    volcanoSamples.forEach((s)=> { (typeof(s.RLDistance)=='number')? s.RLDistance = s.RLDistance: s.RLDistance = 0})
    let RLdistances = []
    volcanoSamples.forEach((s)=> {RLdistances.push(s.RLDistance)})
    const [mean, std] = getStandardDeviation(RLdistances)
 
     // default show std
    const btn_std = document.getElementById("btn_std")
    btn_std.disabled = false
    btn_std.checked = true 
    document.getElementById("myRange").disabled = true
    // pre-calculate std of each volcano
    const sampleGroups = groupSamples(volcanoSamples, std, mean)
    // store std
    allsampleGroups.push({"volcanName" : volcanName, "stdGroups" : sampleGroups, "stdValue": std})
    drawGlyph(allsampleGroups, true, null) // TODO:: draw all the grouped samples ::xian (sampleGroups => xxx)
   
    btn_std.onchange = function() {
      if(btn_std.checked) {
        document.getElementById("myRange").disabled = true
        drawGlyph(allsampleGroups, std, null) //show pre-calcu value
      }else {
        document.getElementById("myRange").disabled = false
        const [sampleGroups, pct] = groupSamplesbyPercentage(allsampleGroups) // only use 'volcanoName'
        // allsampleGroups.forEach((volcanoGroup)=>{
        //   if(volcanoGroup['volcanName'] == volcanName) volcanoGroup['data'] =  sampleGroups
        // })  
        // drawGlyph(allsampleGroups, null, pct) // TODO:: draw all the grouped samples ::xian (sampleGroups => xxx)
      }
    }
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
