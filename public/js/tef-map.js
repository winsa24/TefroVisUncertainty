import { sampleTipText } from './tef-utils.js'


export default function map() {
  var map = {}
  var _mapContainer
  var _volcanes
  var _samples
  var _tef
  let selectedVolcanes // TOFIX :: 
  const targetKeys = [
    'SiO2',
    'TiO2',
    'Al2O3',
    'FeOT',
    'MnO',
    'MgO',
    'CaO',
    'Na2O',
    'K2O',
    'P2O5',
    'Cl',
    'LOI',
    'Total',
    'Rb',
    'Sr',
    'Y',
    'Zr',
    'Nb',
    'Cs',
    'Ba',
    'La',
    'Ce',
    'Pr',
    'Nd',
    'Sm',
    'Eu',
    'Gd',
    'Tb',
    'Dy',
    'Ho',
    'Er',
    'Tm',
    'Yb',
    'Lu',
    'Hf',
    'Ta',
    'Pb',
    'Th',
    'U',
    '87Sr_86Sr',
    '143Nd_144Nd'
  ]
  

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
    initElementSelectors()
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

  function initElementSelectors() {
    const dims = ['element1', 'element2']
    dims.forEach(thisDim => {
      const div = d3.selectAll('#mapSelector').attr('class', 'btn-group')
      div
        .append('button')
        .attr('type', 'button')
        .attr('class', 'btn btn-secondary dropdown-toggle')
        .attr('data-bs-toggle', 'dropdown')
        //.attr('aria-haspopup', 'true')
        .attr('aria-expanded', false)
        .attr('id', thisDim + '_label')
        .html(thisDim)
      const divDrop = div.append('div')
        .attr('class', 'dropdown-menu')
        .attr('aria-labelledby', thisDim + '_label')
        .style('height', '400px')
        .style('overflow', 'scroll')
        .attr('id', thisDim + '_drop')
      targetKeys.forEach((e, i) => {
        var active = false
        if ((e == 'SiO2' && thisDim == 'element1') || (e == 'K2O' && thisDim == 'element2')) {
          active = true
        }
        divDrop
          .append('a')
          .attr('class', 'dropdown-item')
          .attr('id', 'el_' + e)
          .on('click', () => {
            d3
              .select('#' + thisDim + '_drop')
              .selectAll('.dropdown-item')
              .classed('active', false)
            d3
              .select('#' + thisDim + '_drop')
              .select('#el_' + e)
              .classed('active', true)
            // // TODO :: update samples
             _tef.updateSelectedSamples()
            updateBlob(selectedVolcanes)
            
            const value = (div.select('#' + thisDim + '_drop').selectAll('.active').node().id).substring(3)
            d3
              .selectAll('#' + thisDim + '_label')
              .html(thisDim + ' (' + value + ')')
          })
          .classed('active', active)
          .html(e)
      })
      const value = (d3.select('#' + thisDim + '_drop').selectAll('.active').node().id).substring(3)
      div
        .selectAll('#' + thisDim + '_label')
        .html(thisDim + ' (' + value + ')')
    })
  }


  let polylines = L.layerGroup()
  let polylinesArray = []

  function updateBlob(volcanName){
    polylinesArray.forEach(function (item) {
      polylines.removeLayer(item)
    });
    polylinesArray = [];
    drawSamplesBorder(volcanName)
  }
  
  // TOFIX:: fix why point has many lines
  function findClosestGT(volcanoSample, groundTruthSamples, element1, element2){
    let diff = 10000;
    let gtSample = groundTruthSamples[0]
    groundTruthSamples.forEach((s) => {
      let tmp = Math.abs((s['uncertainty'][element1] + s['uncertainty'][element2])/2 - (volcanoSample['uncertainty'][element1] + volcanoSample['uncertainty'][element2])/2)
      if(tmp < diff){
        gtSample = s
        diff = tmp
      }
    })

    return gtSample
  }

  function drawSamplesBorder(volcanName){
    const volcanoSamples = _samples[volcanName]
    const groundTruthSamples = volcanoSamples.filter(obj => {
      return (obj.typeOfRegister === 'Effusive material') || (obj.typeOfRegister === 'Pyroclastic material' && obj.TypeOfAnalysis === 'Bulk');
    });
    const volcanIcon = _volcanes[volcanName]

    var element1 = (d3.select('#element1_drop').selectAll('.active').node().id).substring(3)
    var element2 = (d3.select('#element2_drop').selectAll('.active').node().id).substring(3)

    let latlngall = [], latlnge = []
    
    // // original
    // volcanoSamples.forEach((s) =>{ 
    //   latlngall.push(s._latlng)
    // })
    // groundTruthSamples.forEach((s) =>{ 
    //   latlnge.push(s._latlng)
    // })
    // let allSamplesPolyline = L.polyline(latlngall, { color: volcanIcon.color, weight: 50, opacity: 0.2 }).addTo(_mapContainer);  
    // let groundTruthSamplesPolyline = L.polyline(latlnge, { color: volcanIcon.color, weight: 50, opacity: 0.6 }).addTo(_mapContainer);  
    // groundTruthSamplesPolyline.bindPopup('<h3 style="text-align: center;">Ground Truth </h3>')
    //     .on('mouseover', function (e) {
    //       this.openPopup()
    //     })
    //     .on('mouseout', function (e) {
    //       this.closePopup()
    //     })

    // // dash array
    // latlngall.push(volcanoSamples[0]._latlng)
    // volcanoSamples.forEach((s) =>{ 
    //   latlngall.push(s._latlng)
    //   let uncertainty = Object.values(s['uncertainty']).toString()
    //   L.polyline(latlngall, { color: volcanIcon.color, weight: 5, opacity: 0.2, dashArray: uncertainty}).addTo(_mapContainer);
    //   latlngall.shift()  
    // })

    // TODO:: link to closest GT point
    // latlngall.push(volcanoSamples[0]._latlng)
    volcanoSamples.forEach((s) =>{ 
      let gtSample = findClosestGT(s, groundTruthSamples, element1, element2)  // TODO:: add options to select
      latlngall.push(s._latlng)
      latlngall.push(gtSample._latlng)
      let average = Object.values(s['uncertainty']).reduce((a, b) => a + b) /  Object.values(s['uncertainty']).length;
      // let polyline = L.polyline(latlngall, { color: volcanIcon.color, weight: average, opacity: 0.2 }).addTo(active_polyline);
      let polyline = L.polyline(latlngall, { color: volcanIcon.color, weight: average, opacity: 0.2 }).addTo(_mapContainer);
      latlngall = []
      // latlngall.shift()   // shift() => end to end link. pop() => center to one
      polylines.addLayer(polyline)
      polylinesArray.push(polyline)
    })
    console.log(polylinesArray)
    polylines.addTo(_mapContainer)
    
  }

  
  function avgObj(composArray){
    let avgChemiCompos = {}
    let chemiComposValues = {}  // "SiO2": [6.4, 8.2, 21.2..],  "K2O" : [0.32, 0.1, 0.23..],  ...

    // avg of ground truth 
    composArray.forEach(item => {
      if((item.TypeOfRegister === 'Effusive material') || (item.TypeOfRegister === 'Pyroclastic material' && item.TypeOfAnalysis === 'Bulk')){
        for (const key in item) {
          if(targetKeys.indexOf(key)!= -1){
            if (!(key in chemiComposValues)){
              chemiComposValues[key] = new Array()
              chemiComposValues[key].push(item[key])
            }else{
              chemiComposValues[key].push(item[key])
            }
          }
        }
      }
    })
    // get average for each chemical element
    for (const key in chemiComposValues) {
      if(targetKeys.indexOf(key)!= -1){
        const sum = chemiComposValues[key].reduce((a, b) => a + b, 0);
        const avg = (sum / chemiComposValues[key].length) || 0;
        avgChemiCompos[key] = avg
      }
    }
    return avgChemiCompos
  }

  // calculate distance to avg of each sample. add an additional column
  function disAvg(samplesArray, avgChemiCompos){
    samplesArray.forEach(sample => {
      let uncertaintyArray = {} // each sample, each elements difference to average
      for (const key in sample) {
        if(targetKeys.indexOf(key)!= -1){
          const dis = Math.abs(sample[key] - avgChemiCompos[key])
          uncertaintyArray[key] = dis
        }
      }
      sample['uncertainty'] = uncertaintyArray
    })
    return samplesArray
  }

  function getChemiCompos(samplesArray){
    let chemiCompos = [];
    
    samplesArray.forEach(item => {
      let tmp = {"Volcano": item.Volcano, "TypeOfRegister": item.TypeOfRegister, 'TypeOfAnalysis': item.TypeOfAnalysis}
      for (const key in item) {
        if(targetKeys.indexOf(key)!= -1){
          tmp[key] = item[key]
        }
      }
      chemiCompos.push(tmp)
    })
    
    // console.log(chemiCompos)
    return chemiCompos
  }

  function drawChemiCompos(volcanName, samples){
    const circleSamples = _samples[volcanName]
    const chemiCompos = getChemiCompos(samples)
    const avgChemiCompos = avgObj(chemiCompos)
    // TODO:: add avgChemiCompos to a volcan data
    return disAvg(samples, avgChemiCompos) // samples with an "uncertainty" column
  }

  // UPDATES AFTER USER SELECTION
  map.updateSelectedVolcano = function (volcan, isSelected, samples) {
    selectedVolcanes = volcan
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
      samples = drawChemiCompos(volcan, samples) // add uncertainty column
      addSamples(volcan, samples)
      drawSamplesBorder(volcan)
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
      // original
      var newCircle = L.circle([lat, lon], { radius: 200, color: volcanIcon.color, fillColor: volcanIcon.color, weight: 1, fill: true})
      // // dash array
      // let uncertainty = Object.values(m.uncertainty).toString();
      // var newCircle = L.circle([lat, lon], { radius: 200, color: "#000", fillColor: volcanIcon.color, weight: 1, fill: true, dashArray: uncertainty })

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
      newCircle.uncertainty = m.uncertainty
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
