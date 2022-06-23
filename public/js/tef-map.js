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
      // var lat = Number(volcan._bounds._northEast.lat)
      // var lon = Number(volcan._bounds._northEast.lng)
      var diff = 0.05

      var imageUrl = `/img/heatmap_${bins}_Reds/${volcanName}.png`
      if(['Huanquihue Group', 'Carrán-Los Venados', 'Yanteles', 'Viedma'].indexOf(volcanName) >= 0)  imageUrl = `/img/heatmap_2_Reds/Corcovado.png`
      if(['Puntiagudo', 'Tronador', 'Arenales', 'Aguilera', 'Reclus', 'Fueguino', 'Monte Burney'].indexOf(volcanName) >= 0)  imageUrl = `/img/heatmap_2_Reds/Corcovado.png`
      var imageBounds = [[lat + diff * 2, lon + diff * 4], [lat - diff * 2, lon - diff * 4]]
      let volcanIm = L.imageOverlay(imageUrl, imageBounds, {alt: `no plot for ${volcanName}`}).addTo(_mapContainer)
      volcanIms.push(volcanIm)
    }
  }
  map.addVolcanoes = function (volcanes) {
    let SN = []
    volcanes.forEach(function (volcan, i) {
      SN.push(volcan.number_of_samples)
    })
    var cmReds = d3.scaleQuantize()
    .domain([Math.min(...SN),Math.max(...SN)])// TODO:: normlize volcan sample number
    .range(["#fff5f0","#fff4ef","#fff4ee","#fff3ed","#fff2ec","#fff2eb","#fff1ea","#fff0e9","#fff0e8","#ffefe7","#ffeee6","#ffeee6","#ffede5","#ffece4","#ffece3","#ffebe2","#feeae1","#fee9e0","#fee9de","#fee8dd","#fee7dc","#fee6db","#fee6da","#fee5d9","#fee4d8","#fee3d7","#fee2d6","#fee2d5","#fee1d4","#fee0d2","#fedfd1","#feded0","#feddcf","#fedccd","#fedbcc","#fedacb","#fed9ca","#fed8c8","#fed7c7","#fdd6c6","#fdd5c4","#fdd4c3","#fdd3c1","#fdd2c0","#fdd1bf","#fdd0bd","#fdcfbc","#fdceba","#fdcdb9","#fdccb7","#fdcbb6","#fdc9b4","#fdc8b3","#fdc7b2","#fdc6b0","#fdc5af","#fdc4ad","#fdc2ac","#fdc1aa","#fdc0a8","#fcbfa7","#fcbea5","#fcbca4","#fcbba2","#fcbaa1","#fcb99f","#fcb89e","#fcb69c","#fcb59b","#fcb499","#fcb398","#fcb196","#fcb095","#fcaf94","#fcae92","#fcac91","#fcab8f","#fcaa8e","#fca98c","#fca78b","#fca689","#fca588","#fca486","#fca285","#fca183","#fca082","#fc9e81","#fc9d7f","#fc9c7e","#fc9b7c","#fc997b","#fc987a","#fc9778","#fc9677","#fc9475","#fc9374","#fc9273","#fc9071","#fc8f70","#fc8e6f","#fc8d6d","#fc8b6c","#fc8a6b","#fc8969","#fc8868","#fc8667","#fc8565","#fc8464","#fb8263","#fb8162","#fb8060","#fb7f5f","#fb7d5e","#fb7c5d","#fb7b5b","#fb795a","#fb7859","#fb7758","#fb7657","#fb7455","#fa7354","#fa7253","#fa7052","#fa6f51","#fa6e50","#fa6c4e","#f96b4d","#f96a4c","#f9684b","#f9674a","#f96549","#f86448","#f86347","#f86146","#f86045","#f75e44","#f75d43","#f75c42","#f65a41","#f65940","#f6573f","#f5563e","#f5553d","#f4533c","#f4523b","#f4503a","#f34f39","#f34e38","#f24c37","#f24b37","#f14936","#f14835","#f04734","#ef4533","#ef4433","#ee4332","#ed4131","#ed4030","#ec3f2f","#eb3d2f","#eb3c2e","#ea3b2d","#e93a2d","#e8382c","#e7372b","#e6362b","#e6352a","#e5342a","#e43229","#e33128","#e23028","#e12f27","#e02e27","#df2d26","#de2c26","#dd2b25","#dc2a25","#db2924","#da2824","#d92723","#d72623","#d62522","#d52422","#d42321","#d32221","#d22121","#d12020","#d01f20","#ce1f1f","#cd1e1f","#cc1d1f","#cb1d1e","#ca1c1e","#c91b1e","#c71b1d","#c61a1d","#c5191d","#c4191c","#c3181c","#c2181c","#c0171b","#bf171b","#be161b","#bd161a","#bb151a","#ba151a","#b91419","#b81419","#b61419","#b51319","#b41318","#b21218","#b11218","#b01218","#ae1117","#ad1117","#ac1117","#aa1017","#a91016","#a71016","#a60f16","#a40f16","#a30e15","#a10e15","#a00e15","#9e0d15","#9c0d14","#9b0c14","#990c14","#970c14","#960b13","#940b13","#920a13","#900a13","#8f0a12","#8d0912","#8b0912","#890812","#870811","#860711","#840711","#820711","#800610","#7e0610","#7c0510","#7a0510","#78040f","#76040f","#75030f","#73030f","#71020e","#6f020e","#6d010e","#6b010e","#69000d","#67000d"]);
    
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


      // var imageUrl = `/img/heatmap_${bins}_r/${volcan.Name}.png`
      // if(['Huanquihue Group', 'Carrán-Los Venados', 'Yanteles', 'Viedma'].indexOf(volcan.Name) >= 0)  imageUrl = `/img/scatter_plots_fillPolygon_RLcase_allCluster_allgrayscale/Corcovado.png`
      // if(['Puntiagudo', 'Tronador', 'Arenales', 'Aguilera', 'Reclus', 'Fueguino', 'Monte Burney'].indexOf(volcan.Name) >= 0)  imageUrl = `/img/scatter_plots_fillPolygon_RLcase_allCluster_allgrayscale/Corcovado.png`
      // var imageBounds = [[lat + diff * 2, lon + diff * 4], [lat - diff * 2, lon - diff * 4]]
      // L.imageOverlay(imageUrl, imageBounds, {alt: `no plot for ${volcan.Name}`}).addTo(_mapContainer)

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
