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
      let zoomLevel = _mapContainer.getZoom()
      if(zoomLevel <= 3) bins = 2;
      else if(zoomLevel > 3 && zoomLevel <= 6) bins = 10;
      else if(zoomLevel > 6 && zoomLevel <= 8) bins = 20;
      else if(zoomLevel > 8 && zoomLevel <= 10) bins = 50;
      else bins = 100;
  
      removeOldIms()
      addNewIms()
      if(bins > 50) {
        if(myMasks.length < 1) drawRLPathRect()
      }
      else removeOldMasks()
    })

    _volcanes = {}
    _samples = {}
    return map
  }
  
  let myrls = []; // my volcano regression line
  let myMasks = []; // my volcano filter mask
  function removeOldMasks(){
    myrls.forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
    myMasks.forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
    myrls = []
    myMasks = []
  }

  function drawRLPathRect(){
    // only draw on selected volcanoes 
    // loop
    // volcan is one in the loop 
    for (const [volcanName, volcan] of Object.entries(_volcanes)) {
      let volcanIm_latlng = volcan.image._bounds._southWest
      // get all value in pixel
      let start = _mapContainer.latLngToContainerPoint(volcanIm_latlng)
      let length = 650 
      let k = (volcan.effusive_regression_b == -1 || !volcan.effusive_regression_b)? 0 : volcan.effusive_regression_b
      // let k = 0.35
      let b = (volcan.effusive_regression_a == -1 || !volcan.effusive_regression_a)? 0 : volcan.effusive_regression_a
      // let b = 56.5
      // let b = 0 
      let angle = Math.atan(k)
      start.y -= b
      let end = {x: start.x + length * Math.cos(angle), y: start.y - length * Math.sin(angle)}
      // from pixel to latlng
      let lineStart = _mapContainer.containerPointToLatLng(start)
      let lineEnd = _mapContainer.containerPointToLatLng(end)

      // polygon 4 corner
      let halfWidth = 10
      let leftTop = {x: start.x - halfWidth * Math.sin(angle), y: start.y - halfWidth * Math.cos(angle)}
      let rightTop = {x: end.x - halfWidth * Math.sin(angle), y: end.y - halfWidth * Math.cos(angle)}
      let leftBottom = {x: start.x + halfWidth * Math.sin(angle), y: start.y + halfWidth * Math.cos(angle)}
      let rightBottom = {x: end.x + halfWidth * Math.sin(angle), y: end.y + halfWidth * Math.cos(angle)}

      let GeoleftTop = _mapContainer.containerPointToLatLng(leftTop)
      let GeorightTop = _mapContainer.containerPointToLatLng(rightTop)
      let GeoleftBottom = _mapContainer.containerPointToLatLng(leftBottom)
      let GeorightBottom = _mapContainer.containerPointToLatLng(rightBottom)
      
      var bounds = [
        GeoleftTop,
        GeoleftBottom,
        GeorightBottom,
        GeorightTop
      ];

      let myrl = L.polyline([lineStart, lineEnd], {color: volcan.color, opacity: 0.7}).addTo(_mapContainer)
      myrls.push(myrl)
      _volcanes[volcanName].myRL = myrl
      let myMask = L.polygon(bounds, {color: 'gray', weight: 1}).addTo(_mapContainer)
      myMasks.push(myMask)
      _volcanes[volcanName].myMask = myMask
    }
    filterSize()
  }

  function filterSize(){
    var slider = document.getElementById("myRange");
    var output = document.getElementById("demo");
    slider.oninput = function() {
      output.innerHTML = this.value
      removeOldMasks()
      for (const [volcanName, volcan] of Object.entries(_volcanes)) {
        let start = _mapContainer.latLngToContainerPoint(volcan.myRL._bounds._southWest)
        let end = _mapContainer.latLngToContainerPoint(volcan.myRL._bounds._northEast)
        let k = (volcan.effusive_regression_b == -1 || !volcan.effusive_regression_b)? 0 : volcan.effusive_regression_b
        let angle = Math.atan(k)
        
        let halfWidth = 10 * this.value
        let leftTop = {x: start.x - halfWidth * Math.sin(angle), y: start.y - halfWidth * Math.cos(angle)}
        let rightTop = {x: end.x - halfWidth * Math.sin(angle), y: end.y - halfWidth * Math.cos(angle)}
        let leftBottom = {x: start.x + halfWidth * Math.sin(angle), y: start.y + halfWidth * Math.cos(angle)}
        let rightBottom = {x: end.x + halfWidth * Math.sin(angle), y: end.y + halfWidth * Math.cos(angle)}
        // from pixel to latlng
        let GeoleftTop = _mapContainer.containerPointToLatLng(leftTop)
        let GeorightTop = _mapContainer.containerPointToLatLng(rightTop)
        let GeoleftBottom = _mapContainer.containerPointToLatLng(leftBottom)
        let GeorightBottom = _mapContainer.containerPointToLatLng(rightBottom)
        let bounds = [
          GeoleftTop,
          GeoleftBottom,
          GeorightBottom,
          GeorightTop
        ];
        let myMask = L.polygon(bounds, {color: 'gray', weight: 1}).addTo(_mapContainer)
        myMasks.push(myMask)
        _volcanes[volcanName].myMask = myMask
      }
    }
  }
  
  let volcanIms = []
  function removeOldIms(){
    volcanIms.forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
  }
  function addNewIms(){
    for (const [volcanName, volcan] of Object.entries(_volcanes)) {
      // [0.12, 0.2]=> put image org at the triangle top
      let lat = Number(volcan._latlng.lat) + 0.12
      let lon =  Number(volcan._latlng.lng) + 0.2
      var diff = 0.05

      let start = _mapContainer.latLngToContainerPoint(volcan._latlng)
     
      let end = {x: start.x + 122, y: start.y - 96.6}
      
      // from pixel to latlng
      let lineStart = _mapContainer.containerPointToLatLng(start)
      let lineEnd = _mapContainer.containerPointToLatLng(end)


      var imageUrl = `/img/heatmap_${bins}_viridis_r/${volcanName}.png`
      if(['Huanquihue Group', 'Carrán-Los Venados', 'Yanteles', 'Viedma'].indexOf(volcanName) >= 0)  imageUrl = `/img/blank.png`
      if(['Puntiagudo', 'Tronador', 'Arenales', 'Aguilera', 'Reclus', 'Fueguino', 'Monte Burney'].indexOf(volcanName) >= 0)  imageUrl = `/img/blank.png`
      let imageBounds;
      if(bins < 50){
        imageBounds = [lineStart, lineEnd]
      }
      else{
        imageBounds = [[lat + diff * 2, lon + diff * 4], [lat - diff * 2, lon - diff * 4]]
      }
      let volcanIm = L.imageOverlay(imageUrl, imageBounds, {alt: `no plot for ${volcanName}`}).addTo(_mapContainer)
      volcanIms.push(volcanIm)
      _volcanes[volcanName].image = volcanIm
    }
    
  }
  map.addVolcanoes = function (volcanes) {
    let SN = []
    volcanes.forEach(function (volcan, i) {
      SN.push(volcan.number_of_samples)
    })
    let viridis = ["#440154","#440256","#450457","#450559","#46075a","#46085c","#460a5d","#460b5e","#470d60","#470e61","#471063","#471164","#471365","#481467","#481668","#481769","#48186a","#481a6c","#481b6d","#481c6e","#481d6f","#481f70","#482071","#482173","#482374","#482475","#482576","#482677","#482878","#482979","#472a7a","#472c7a","#472d7b","#472e7c","#472f7d","#46307e","#46327e","#46337f","#463480","#453581","#453781","#453882","#443983","#443a83","#443b84","#433d84","#433e85","#423f85","#424086","#424186","#414287","#414487","#404588","#404688","#3f4788","#3f4889","#3e4989","#3e4a89","#3e4c8a","#3d4d8a","#3d4e8a","#3c4f8a","#3c508b","#3b518b","#3b528b","#3a538b","#3a548c","#39558c","#39568c","#38588c","#38598c","#375a8c","#375b8d","#365c8d","#365d8d","#355e8d","#355f8d","#34608d","#34618d","#33628d","#33638d","#32648e","#32658e","#31668e","#31678e","#31688e","#30698e","#306a8e","#2f6b8e","#2f6c8e","#2e6d8e","#2e6e8e","#2e6f8e","#2d708e","#2d718e","#2c718e","#2c728e","#2c738e","#2b748e","#2b758e","#2a768e","#2a778e","#2a788e","#29798e","#297a8e","#297b8e","#287c8e","#287d8e","#277e8e","#277f8e","#27808e","#26818e","#26828e","#26828e","#25838e","#25848e","#25858e","#24868e","#24878e","#23888e","#23898e","#238a8d","#228b8d","#228c8d","#228d8d","#218e8d","#218f8d","#21908d","#21918c","#20928c","#20928c","#20938c","#1f948c","#1f958b","#1f968b","#1f978b","#1f988b","#1f998a","#1f9a8a","#1e9b8a","#1e9c89","#1e9d89","#1f9e89","#1f9f88","#1fa088","#1fa188","#1fa187","#1fa287","#20a386","#20a486","#21a585","#21a685","#22a785","#22a884","#23a983","#24aa83","#25ab82","#25ac82","#26ad81","#27ad81","#28ae80","#29af7f","#2ab07f","#2cb17e","#2db27d","#2eb37c","#2fb47c","#31b57b","#32b67a","#34b679","#35b779","#37b878","#38b977","#3aba76","#3bbb75","#3dbc74","#3fbc73","#40bd72","#42be71","#44bf70","#46c06f","#48c16e","#4ac16d","#4cc26c","#4ec36b","#50c46a","#52c569","#54c568","#56c667","#58c765","#5ac864","#5cc863","#5ec962","#60ca60","#63cb5f","#65cb5e","#67cc5c","#69cd5b","#6ccd5a","#6ece58","#70cf57","#73d056","#75d054","#77d153","#7ad151","#7cd250","#7fd34e","#81d34d","#84d44b","#86d549","#89d548","#8bd646","#8ed645","#90d743","#93d741","#95d840","#98d83e","#9bd93c","#9dd93b","#a0da39","#a2da37","#a5db36","#a8db34","#aadc32","#addc30","#b0dd2f","#b2dd2d","#b5de2b","#b8de29","#bade28","#bddf26","#c0df25","#c2df23","#c5e021","#c8e020","#cae11f","#cde11d","#d0e11c","#d2e21b","#d5e21a","#d8e219","#dae319","#dde318","#dfe318","#e2e418","#e5e419","#e7e419","#eae51a","#ece51b","#efe51c","#f1e51d","#f4e61e","#f6e620","#f8e621","#fbe723","#fde725"]
    let viridis_r = viridis.reverse()
    var cmReds = d3.scaleQuantize()
    .domain([Math.min(...SN),Math.max(...SN)])// TODO:: normlize volcan sample number
    .range(viridis_r)

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

      let sampleNumbers = volcan.number_of_samples
      // var volcanIcon = L.polygon(latlngs, { color: 'grey', fillOpacity: 0.7, opacity: 0.7 })
      let latLng = L.latLng(lat, lon)
      var volcanIcon = L.triangleMarker(latLng, {
        rotation: 0,
        width: 20,
        height: 20,
        color: cmReds(sampleNumbers),
        fillColor: cmReds(sampleNumbers)
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
