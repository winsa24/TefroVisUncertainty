import { sampleTipText } from './tef-utils.js'


export default function map() {
  var map = {}
  var _mapContainer
  var _volcanes
  var _samples
  var _tef
  var _sampleCircles
  var _selectedVolcanoes
  // SETUP THE IMAGE DIMENSIONS. THIS IS THE FIXED DIMENSIONS
  // OF THE IMAGES. I PRESERVE THE WIDTH/HEIGHT RATIO 
  let volcanIms = []
  var imgWidth = 400
  var imgHeight = 316

  let bins = 10;
  let myrls = []; // my volcano regression line
  let myMasks = {}; // my volcano filter mask
  var myMasksLayerGroup
  function removeOldMasks() {
    myMasksLayerGroup.removeFrom(_mapContainer)
    myMasksLayerGroup = L.layerGroup([])
    myMasksLayerGroup.addTo(_mapContainer)
  }
  function removeRLs(){
    myrls.forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
    myrls = []
  }

  var slider = document.getElementById("my-range");
  var output = document.getElementById("demo");
  slider.disabled = true;
  // Here goes all the slider changing things
  slider.oninput = function () {
    output.innerHTML = this.value * 10
    removeOldMasks()
    drawMask(10* this.value)
    _selectedVolcanoes.forEach( (volcan) =>{
      removeSamples(volcan)
      addSampleCircles(volcan, 0.05 * this.value)
      removeSampleTails()
      if(tailStatus) drawSampleTail(_sampleCircles[volcan])
    })
  }
  
  $('#volcan-color').click(function(){
    if($(this).is(':checked')){
      Object.keys(_volcanes).forEach(volcan => {
        _volcanes[volcan].setStyle({color: _volcanes[volcan].color})
      })
    } else {
      Object.keys(_volcanes).forEach(volcan => {
        _volcanes[volcan].setStyle({color:  _volcanes[volcan].colorMap}) 
      })
    }
  });
  $('#volcan-RL').click(function(){
    if($(this).is(':checked')){
      removeOldIms()
    } else {
      addNewIms()
    }
  });
  let tailStatus = true
  $('#sample-tail').click(function(){
    if($(this).is(':checked')){
      removeSampleTails()
      tailStatus = false
    } else {
      tailStatus = true
      _selectedVolcanoes.forEach( (volcan) =>{
        removeSamples(volcan)
        addSampleCircles(volcan, 0.05 * this.value)
        removeSampleTails()
        drawSampleTail(_sampleCircles[volcan])
      })
    }
  });

  let textMarker;

  
  let cmReds;
  function colorbar(SN){
    let viridis = ["#440154", "#440256", "#450457", "#450559", "#46075a", "#46085c", "#460a5d", "#460b5e", "#470d60", "#470e61", "#471063", "#471164", "#471365", "#481467", "#481668", "#481769", "#48186a", "#481a6c", "#481b6d", "#481c6e", "#481d6f", "#481f70", "#482071", "#482173", "#482374", "#482475", "#482576", "#482677", "#482878", "#482979", "#472a7a", "#472c7a", "#472d7b", "#472e7c", "#472f7d", "#46307e", "#46327e", "#46337f", "#463480", "#453581", "#453781", "#453882", "#443983", "#443a83", "#443b84", "#433d84", "#433e85", "#423f85", "#424086", "#424186", "#414287", "#414487", "#404588", "#404688", "#3f4788", "#3f4889", "#3e4989", "#3e4a89", "#3e4c8a", "#3d4d8a", "#3d4e8a", "#3c4f8a", "#3c508b", "#3b518b", "#3b528b", "#3a538b", "#3a548c", "#39558c", "#39568c", "#38588c", "#38598c", "#375a8c", "#375b8d", "#365c8d", "#365d8d", "#355e8d", "#355f8d", "#34608d", "#34618d", "#33628d", "#33638d", "#32648e", "#32658e", "#31668e", "#31678e", "#31688e", "#30698e", "#306a8e", "#2f6b8e", "#2f6c8e", "#2e6d8e", "#2e6e8e", "#2e6f8e", "#2d708e", "#2d718e", "#2c718e", "#2c728e", "#2c738e", "#2b748e", "#2b758e", "#2a768e", "#2a778e", "#2a788e", "#29798e", "#297a8e", "#297b8e", "#287c8e", "#287d8e", "#277e8e", "#277f8e", "#27808e", "#26818e", "#26828e", "#26828e", "#25838e", "#25848e", "#25858e", "#24868e", "#24878e", "#23888e", "#23898e", "#238a8d", "#228b8d", "#228c8d", "#228d8d", "#218e8d", "#218f8d", "#21908d", "#21918c", "#20928c", "#20928c", "#20938c", "#1f948c", "#1f958b", "#1f968b", "#1f978b", "#1f988b", "#1f998a", "#1f9a8a", "#1e9b8a", "#1e9c89", "#1e9d89", "#1f9e89", "#1f9f88", "#1fa088", "#1fa188", "#1fa187", "#1fa287", "#20a386", "#20a486", "#21a585", "#21a685", "#22a785", "#22a884", "#23a983", "#24aa83", "#25ab82", "#25ac82", "#26ad81", "#27ad81", "#28ae80", "#29af7f", "#2ab07f", "#2cb17e", "#2db27d", "#2eb37c", "#2fb47c", "#31b57b", "#32b67a", "#34b679", "#35b779", "#37b878", "#38b977", "#3aba76", "#3bbb75", "#3dbc74", "#3fbc73", "#40bd72", "#42be71", "#44bf70", "#46c06f", "#48c16e", "#4ac16d", "#4cc26c", "#4ec36b", "#50c46a", "#52c569", "#54c568", "#56c667", "#58c765", "#5ac864", "#5cc863", "#5ec962", "#60ca60", "#63cb5f", "#65cb5e", "#67cc5c", "#69cd5b", "#6ccd5a", "#6ece58", "#70cf57", "#73d056", "#75d054", "#77d153", "#7ad151", "#7cd250", "#7fd34e", "#81d34d", "#84d44b", "#86d549", "#89d548", "#8bd646", "#8ed645", "#90d743", "#93d741", "#95d840", "#98d83e", "#9bd93c", "#9dd93b", "#a0da39", "#a2da37", "#a5db36", "#a8db34", "#aadc32", "#addc30", "#b0dd2f", "#b2dd2d", "#b5de2b", "#b8de29", "#bade28", "#bddf26", "#c0df25", "#c2df23", "#c5e021", "#c8e020", "#cae11f", "#cde11d", "#d0e11c", "#d2e21b", "#d5e21a", "#d8e219", "#dae319", "#dde318", "#dfe318", "#e2e418", "#e5e419", "#e7e419", "#eae51a", "#ece51b", "#efe51c", "#f1e51d", "#f4e61e", "#f6e620", "#f8e621", "#fbe723", "#fde725"]
    let viridis_r = viridis.reverse()
    cmReds = d3.scaleQuantize()
    .domain([Math.min(...SN), Math.max(...SN)])// TODO:: normlize volcan sample number
    .range(viridis_r)
    // append a defs (for definition) element to your SVG
    var svgLegend = d3.select('#legend').append('svg');
    var defs = svgLegend.append('defs');
    // append a linearGradient element to the defs and give it a unique id
    var linearGradient = defs.append('linearGradient')
    .attr('id', 'linear-gradient');

    // horizontal gradient
    linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

    //Append multiple color stops by using D3's data/enter step
    linearGradient.selectAll("stop")
      .data( cmReds.range() )
      .enter().append("stop")
      .attr("offset", function(d,i) { return i/(cmReds.range().length-1); })
      .attr("stop-color", function(d) { return d; });

    // append title
    svgLegend.append("text")
      .attr("class", "legendTitle")
      .attr("x", 0)
      .attr("y", 20)
      .style("text-anchor", "left")
      .text("Sample Number");

    // draw the rectangle and fill with gradient
    svgLegend.append("rect")
      .attr("x", 0)
      .attr("y", 30)
      .attr("width", 300)
      .attr("height", 15)
      .style("fill", "url(#linear-gradient)");

    //create tick marks
    var xLeg = d3.scaleLinear()
      .domain([Math.min(...SN), Math.max(...SN)])
      .range([0, 300]);

    var axisLeg = d3.axisBottom(xLeg).ticks(2);

    svgLegend
    .attr("class", "axis")
    .append("g")
    .attr("transform", "translate(0, 40)")
    .call(axisLeg);
  }
 

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
    // TEST: Mask layers in only one big layer
    myMasksLayerGroup = L.layerGroup([])
    myMasksLayerGroup.addTo(_mapContainer)

    _mapContainer.on('zoomend', function (e) {
      let zoomLevel = _mapContainer.getZoom()
      if (zoomLevel <= 3) bins = 2;
      else if (zoomLevel > 3 && zoomLevel <= 6) bins = 10;
      else if (zoomLevel > 6 && zoomLevel <= 8) bins = 20;
      else if (zoomLevel > 8 && zoomLevel <= 10) bins = 50;
      else bins = 100;

      removeOldIms()
      addNewIms()
      if (bins > 50) {
        if (Object.keys(myMasks).length < 1) {
          drawRL()
          drawMask()
          slider.disabled = false
        }
      }
      else{
        removeOldMasks()
        removeRLs()
        slider.disabled = true
      } 
    })

    _volcanes = {}
    _samples = {}
    _sampleCircles = {}
    _selectedVolcanoes = []
    return map
  }

  function getPosWithin2Points(start, end, length){
    const angle = Math.atan2(end.lat - start.lat, end.lng - start.lng);
    const xOffset = Math.cos(angle) * length;
    const yOffset = Math.sin(angle) * length;
    return {'lat': start.lat + yOffset, 'lng': start.lng + xOffset}
  }

  const volcanNameList = ['Llaima','Sollipulli','Caburga_Huelemolle','Villarrica','Quetrupillán','Lanín','Mocho_Choshuenco','Puyehue_Cordón_Caulle','Antillanca_Casablanca','Osorno','Calbuco','Yate','Apagado','Hornopirén','Huequi','Michinmahuida','Chaitén','Corcovado','Melimoyu','Mentolat','Cay','Macá','Hudson','Lautaro','Aguilera','Reclus','Monte_Burney']

  function reversemapTailLength (value, oldRange, newRange) { // i.e. newRange : [2,1]
    let perc = (value - oldRange[0]) / (oldRange[1] - oldRange[0])
    let newValue = newRange[0] - (newRange[0] - newRange[1]) * perc 
    return newValue;
  }
  function mapTailLength(value, oldRange, newRange){ // i.e. newRange : [1,2]
    let perc = (value - oldRange[0]) / (oldRange[1] - oldRange[0])
    let newValue = (newRange[1] - newRange[0]) * perc + newRange[0]
    return newValue;
  }
  
  var tails = [];
  function removeSampleTails(){
    tails.forEach(function (item) {
      _mapContainer.removeLayer(item)
    });
    tails = []
  }

  function drawSampleTail(sampleArray, threshold = 0.1){
    sampleArray.forEach((s)=>{
      const disToAll = s.distoAllVolcan
      delete disToAll['Reclus']
      delete disToAll['Monte_Burney']
      const minDis = Math.min(...Object.values(disToAll))
      const maxDis = Math.max(...Object.values(disToAll))
      const keysSorted = Object.keys(disToAll).sort(function(a,b){return disToAll[a]-disToAll[b]})

      const sampleCenter = s._latlng
      let refVolcanName = volcanNameList.filter(v => v.substring(0,3) === s.volcano.substring(0,3))[0]
      refVolcanName= refVolcanName.replaceAll("_", "-")
      switch(refVolcanName){
        case "Monte-Burney" : refVolcanName = "Monte Burney"; break
        case "Puyehue-Cordón-Caulle": refVolcanName = "Puyehue-Cordón Caulle"; break;
      }

      for(let i = 0; i < 3; i++){ // only show top three shortest dis
        const v = keysSorted[i]
        // draw tail
        let volcanoName= v.replaceAll("_", "-")
        switch(volcanoName){
          case "Monte-Burney" : volcanoName = "Monte Burney"; break
          case "Puyehue-Cordón-Caulle": volcanoName = "Puyehue-Cordón Caulle"; break;
        }

        // only draw dis < refV's dis
        if(v == refVolcanName) break;

        const potentialVolcan = _volcanes[volcanoName]
        const volcanoBelongCenter = _volcanes[volcanoName]._latlng
        // const tailLength = (disToAll[refVolcanName] - disToAll[v]) * 0.1// further = shorter, closer = longer
        const tailLength = reversemapTailLength(disToAll[v], [minDis, maxDis], [0.2,0])// further = shorter, closer = longer
        const endTail = getPosWithin2Points(sampleCenter, volcanoBelongCenter, tailLength)
        let tail = L.polyline([sampleCenter, endTail], {color: potentialVolcan.color, weight: 5}) // longer line bigger distance to RL
          .addTo(_mapContainer)
          .on('click', function (e) {
            _mapContainer.flyTo(potentialVolcan._latlng, 11)
          })   
        tails.push(tail)
      }
    })
  }

  function drawRL() {
    // only draw on selected volcanoes 
    // loop
    // volcan is one in the loop 
    removeRLs()
    for (const [volcanName, volcan] of Object.entries(_volcanes)) {

      // GET THE STARTING POINT FOR EACH IMAGE
      let startRaw = _mapContainer.latLngToContainerPoint(volcan._latlng)

      let length = 650
      if(!volcan.k) continue
      let k = volcan.k
      let b = (!volcan.b)? 0 : volcan.b
      // I MOVE THE STARTING POINT UP SO THE LEFT BOTTOM
      // CORNER ALIGNS WITH THE TIP OF THE VOLCANO TRIANGLE
      let start = { x: startRaw.x, y: startRaw.y - b}

      let angle = Math.atan(k)
      let end = { x: start.x + length * Math.cos(angle), y: start.y - length * Math.sin(angle) }
      // from pixel to latlng
      let lineStart = _mapContainer.containerPointToLatLng(start)
      let lineEnd = _mapContainer.containerPointToLatLng(end)
      let myrl = L.polyline([lineStart, lineEnd], { color: volcan.color, opacity: 0.7, angle: angle, volcano: volcan }).addTo(_mapContainer)
      myrl.start = L.latLng(lineStart.lat, lineStart.lng)
      myrl.end = L.latLng(lineEnd.lat, lineEnd.lng)
      myrls.push(myrl)
      _volcanes[volcanName].myRL = myrl      
    }
  }

  function drawMask(halfWidth = 100){
    removeOldMasks()
    myrls.forEach(myRL => {
      let start = _mapContainer.latLngToContainerPoint(myRL._bounds._southWest)
      let end = _mapContainer.latLngToContainerPoint(myRL._bounds._northEast)
      let angle = myRL.options.angle

      // polygon 4 corner
      let leftTop = { x: start.x - halfWidth * Math.sin(angle), y: start.y - halfWidth * Math.cos(angle) }
      let rightTop = { x: end.x - halfWidth * Math.sin(angle), y: end.y - halfWidth * Math.cos(angle) }
      let leftBottom = { x: start.x + halfWidth * Math.sin(angle), y: start.y + halfWidth * Math.cos(angle) }
      let rightBottom = { x: end.x + halfWidth * Math.sin(angle), y: end.y + halfWidth * Math.cos(angle) }

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
      let myMask = L.polygon(bounds, { color: 'gray', weight: 1 }) 
      myMasksLayerGroup.addLayer(myMask)
    })
  }

  function removeOldIms() {
    volcanIms.forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
  }
  function addNewIms() {
    for (const [volcanName, volcan] of Object.entries(_volcanes)) {

      // GET THE STARTING POINT FOR EACH IMAGE
      let startRaw = _mapContainer.latLngToContainerPoint(volcan._latlng)

      // I MOVE THE STARTING POINT UP SO THE LEFT BOTTOM
      // CORNER ALIGNS WITH THE TIP OF THE VOLCANO TRIANGLE
      let start = { x: startRaw.x, y: startRaw.y - imgHeight }
      let startLatLng = _mapContainer.containerPointToLatLng(start)

      // I CALCULATE THE IMAGE BOUNDS BASED ON THE IMAGE SIZE RATIO
      let imagePixelBounds = { x: start.x + imgWidth, y: start.y + imgHeight }
      let imageEnd = _mapContainer.containerPointToLatLng(imagePixelBounds)

      var imageUrl = `/img/heatmap_${bins}_viridis_r/${volcanName}.png`
      if (['Huanquihue Group', 'Carrán-Los Venados', 'Yanteles', 'Viedma'].indexOf(volcanName) >= 0) imageUrl = `/img/blank.png`
      if (['Puntiagudo', 'Tronador', 'Arenales', 'Aguilera', 'Reclus', 'Fueguino', 'Monte Burney'].indexOf(volcanName) >= 0) imageUrl = `/img/blank.png`
      let imageBounds, opacity
      if (bins < 50) {
        // imagePixelBounds = { x: start.x + imgWidth * 0.5, y: start.y + imgHeight *0.5}
        start.y += imgHeight * 0.5
        imagePixelBounds.x -= imgWidth * 0.5
        startLatLng = _mapContainer.containerPointToLatLng(start)
        imageEnd = _mapContainer.containerPointToLatLng(imagePixelBounds)
        imageBounds = [startLatLng, imageEnd]
        opacity = 0.01 * bins
      }
      else {
        imageBounds = [startLatLng, imageEnd]
        opacity = 1
      }
      let volcanIm = L.imageOverlay(imageUrl, imageBounds, { alt: `no plot for ${volcanName}` , opacity: opacity  }).addTo(_mapContainer)
      volcanIms.push(volcanIm)
      _volcanes[volcanName].image = volcanIm
    }

  }
  map.addVolcanoes = function (volcanes) {
    let SN = []
    volcanes.forEach(function (volcan, i) {
      SN.push(volcan.number_of_samples)
    })
    colorbar(SN)

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
      volcanIcon.colorMap = cmReds(sampleNumbers)
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
      _volcanes[volcan.Name].k = volcan.k
      _volcanes[volcan.Name].b = volcan.b
      _volcanes[volcan.Name].number_of_samples = volcan.number_of_samples
      _samples[volcan.Name] = []
      _sampleCircles[volcan.Name] = []
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
      _selectedVolcanoes = _selectedVolcanoes.filter(e => e !== volcan)
    } else {
      volcanIcon.setStyle({
        color: volcanIcon.color,
        fillColor: volcanIcon.color,
        fill: true,
        stroke: true
      })
      addSamples(volcan, samples)
      _selectedVolcanoes.push(volcan)
      drawSampleTail(_sampleCircles[volcan])
    }
    return volcanIcon.selected
  }
  map.updateSelectedEvents = function (volcan, eventos) {
    const markers = _sampleCircles[volcan]
    const type = d3.selectAll('.scatter-view:checked').node().value
    markers.forEach((m) => {
      const selected = (eventos.indexOf(m.event) >= 0 && m.event != 'Unknown')
      if (type == 'selected' && !selected) {
        m.isVisible = false
        _mapContainer.removeLayer(m)
      } else {
        if (!m.isVisible) {
          m.isVisible = true
          m.addTo(_mapContainer)
        }
      }
    })
  }
  map.updateSelectedSamples = function (_selectedVolcanoes) {
    for (let volcan in _selectedVolcanoes) {
      map.updateSelectedEvents(volcan, _selectedVolcanoes[volcan].events)
    }
  }
  function addSampleCircles(volcan, threshold = 0.5){
    const volcanIcon = _volcanes[volcan]
    threshold = output.innerHTML * 0.005
    _samples[volcan].forEach(function (m) {
      var lat = m.Latitude
      var lon = m.Longitude
      if(m.sample_RMSE_to_regression && m.sample_RMSE_to_regression > threshold){
        var newCircle = L.circle([lat, lon], { radius: m.sample_RMSE_to_regression ? m.sample_RMSE_to_regression * 2000 : 200, color: volcanIcon.color, fillColor: volcanIcon.color, weight: 1, fill: true })
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
          .on('click', function(e){
            _tef.highlightSampleInScatterplot(m)
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
        _sampleCircles[m.Volcano].push(newCircle)
      }
    })
    console.log('##############333')
    console.log(_sampleCircles[volcan].length)


    if(textMarker) _mapContainer.removeLayer(textMarker)
    var icontext = _sampleCircles[volcan].length + '/' + _samples[volcan].length
    var pos = _volcanes[volcan]._latlng
    var icon = L.divIcon({
      iconSize:null,
      html:'<div class="map-label-content">'+icontext+'</div>'
    });
    textMarker = L.marker(pos,{icon: icon}).addTo(_mapContainer);

  }
  function addSamples(volcan, samples) {
    samples.forEach(function (m) {
      var tipText = sampleTipText(m)
      m.tipText = tipText
      _samples[m.Volcano].push(m)
    })
    addSampleCircles(volcan)
  }
  function removeSamples(volcan) {
    _sampleCircles[volcan].forEach(function (m) {
      _mapContainer.removeLayer(m)
    })
    _sampleCircles[volcan] = []
  }
  return map
}
