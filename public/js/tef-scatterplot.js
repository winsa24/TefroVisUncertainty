import { loading, ready } from "./tef-utils.js"

export default function scatterplot() {
  var scatterplot = {}
  var _tef
  var _n
  var _elements
  var _hiddenOpacity = 0.1
  var _scatterDimensions = []
  var _selectedVolcanes = {}
  var _ndx

  // OBJECT INITIALIZATION
  scatterplot.init = function (tef, elements, volcanes, ndx) {
    _tef = tef
    _n = 0
    _elements = elements
    _selectedVolcanes = volcanes
    _ndx = ndx

    const size = d3.select('#volcanoMap').node().getBoundingClientRect()
    const sizeTabs = d3.select('.nav-tabs').node().getBoundingClientRect()
    d3
      .select('#samplesChemistryTab')
      .style('height', size.height - sizeTabs.height)

    initScatterplot(_n)
    initButtons()
    initSelectors()
    return scatterplot
  }

  function initButtons() {
    d3.select('#addNewScatter')
      .on('click', () => {
        addNewScatter()
      })
  }
  function addNewScatter() {
    _n += 1
    //const callback = () => { _tef.updateScatterplotSelected() }
    //initScatterplot(_n, callback)
    initScatterplot(_n)
  }

  function initSelectors() {
    d3.select('.tef-menu-filter')
      .selectAll('.scatter-view')
      .on('click', () => {
        scatterplot.setHiddenOpacity()
        _tef.updateSelectedSamples()
      })
  }

  // SELECTION
  scatterplot.updateSelectedVolcano = function (selectedVolcanes) {
    _selectedVolcanes = selectedVolcanes
    drawAllScatterplots()
    return scatterplot
  }

  scatterplot.updateSelectedEvents = function (selectedVolcanes) {
    _selectedVolcanes = selectedVolcanes
    drawAllScatterplots()
    return scatterplot
  }

  function drawAllScatterplots() {
    for (let n in _scatterDimensions) {
      drawNScatterplot(n)
    }
  }

  // DRAW THE SCATTERPLOTS  
  function initScatterplot(n) {
    const mainDiv = d3
      .select('#scatter')
      .append('div')
      .attr('id', 'scatter_' + n)
      .attr('class', 'col-6')
      .style('float', 'left')
      .style('padding', '10px')
    initElementSelectors(n)
    mainDiv.append('br')
    mainDiv.append('div').attr('id', 'scatterChart_' + n)
    getDataScatterplot(n)
  }

  function getDataScatterplot(n) {
    var xDim = (d3.select('#xDim_' + n).selectAll('.active').node().id).substring(3)
    var yDim = (d3.select('#yDim_' + n).selectAll('.active').node().id).substring(3)
    _scatterDimensions[n] = _ndx
      .dimension((d) => { return [+d[xDim], +d[yDim], d['Volcano'], d['Event'], d['Flag']] })
      .filter(
        function (d) {
          return d[4] != 'Outlier'
        })
    drawNScatterplot(n)
  }

  function drawNScatterplot(n) {
    var xDim = (d3.select('#xDim_' + n).selectAll('.active').node().id).substring(3)
    var yDim = (d3.select('#yDim_' + n).selectAll('.active').node().id).substring(3)
    loading()
    d3
      .json('/api/extent?x=' + xDim + '&y=' + yDim)
      .then((data) => {
        var values = data.data[0]
        var xExtent = [values.min_x, values.max_x]
        var yExtent = [values.min_y, values.max_y]
        // This is done to add some extra space in the axes
        if (xDim != "87Sr_86Sr" && xDim != "143Nd_144Nd")
          xExtent = [xExtent[0] - xExtent[0] / 10, xExtent[1] + xExtent[1] / 10]
        if (yDim != "87Sr_86Sr" && yDim != "143Nd_144Nd")
          yExtent = [yExtent[0] - yExtent[0] / 10, yExtent[1] + yExtent[1] / 10]

          var isSelectionActive = _tef.isSelectionActive()
        const type = d3.selectAll('.scatter-view:checked').node().value

        const xDimLabel = _tef.getElementLabel(xDim)
        const yDimLabel = _tef.getElementLabel(yDim)

        var scatterGroup = _scatterDimensions[n].group()
        var chart1 = new dc.ScatterPlot("#scatterChart_" + n)
          .height(300)
          .width(320)
          .useCanvas(true)
          .x(d3.scaleLinear().domain(xExtent))
          .y(d3.scaleLinear().domain(yExtent))
          .yAxisLabel(yDim + xDimLabel)
          .xAxisLabel(xDim + yDimLabel)
          .keyAccessor(function (d) { return d.key[0]; })
          .valueAccessor(function (d) { return d.key[1]; })
          .clipPadding(10)
          .dimension(_scatterDimensions[n])
          .highlightedSize(4)
          .symbolSize(5)
          .excludedOpacity(function (opacityKey) {
            if (!isSelectionActive) {
              return 0.05
            } else {
              if (opacityKey[0] in _selectedVolcanes && _selectedVolcanes[opacityKey[0]]['events'].indexOf(opacityKey[1]) >= 0)
                return 0.05
              else
                return 0
            }
          })
          .excludedColor('#ddd')
          .group(scatterGroup)
          .colorAccessor(function (d) { return [d.key[2], d.key[3]]; })
          .colors(function (colorKey) {
            if (colorKey[0] in _selectedVolcanes)
              return _selectedVolcanes[colorKey[0]]['color']
            else
              return '#ddd'
          })
          .opacityAccessor(function (d) { return [d.key[2], d.key[3], d.key[0], d.key[1]]; })
          .opacity(function (opacityKey) {
            if (opacityKey[2] == '' || opacityKey[3] == '') return 0
            if (!isSelectionActive) {
              if (type == 'all') {
                return 1
              } else {
                return 0
              }
            } else {
              if (opacityKey[0] in _selectedVolcanes && _selectedVolcanes[opacityKey[0]]['events'].indexOf(opacityKey[1]) >= 0)
                return 1
              else
                return _hiddenOpacity
            }
          })
          .emptySize(3)
          .emptyColor('#ddd')
          .title(function (d) { return d.value; })
        chart1.yAxis().ticks(5)
        chart1.xAxis().ticks(5)
        chart1.render();
        ready()
      })
  }
  function initElementSelectors(n) {
    const dims = ['x', 'y']
    dims.forEach(thisDim => {
      const div = d3.selectAll('#scatter_' + n).append('div').attr('class', 'btn-group')
      div
        .append('button')
        .attr('type', 'button')
        .attr('class', 'btn btn-secondary dropdown-toggle')
        .attr('data-bs-toggle', 'dropdown')
        //.attr('aria-haspopup', 'true')
        .attr('aria-expanded', false)
        .attr('id', thisDim + 'Dim_' + n + '_label')
        .html(thisDim)
      const divDrop = div.append('div')
        .attr('class', 'dropdown-menu')
        .attr('aria-labelledby', thisDim + 'Dim_' + n + '_label')
        .style('height', '400px')
        .style('overflow', 'scroll')
        .attr('id', thisDim + 'Dim_' + n)
      _elements.forEach((e, i) => {
        var active = false
        if ((e == 'SiO2' && thisDim == 'x') || (e == 'K2O' && thisDim == 'y')) {
          active = true
        }
        divDrop
          .append('a')
          .attr('class', 'dropdown-item')
          .attr('id', 'el_' + e)
          .on('click', () => {
            d3
              .select('#' + thisDim + 'Dim_' + n)
              .selectAll('.dropdown-item')
              .classed('active', false)
            d3
              .select('#' + thisDim + 'Dim_' + n)
              .select('#el_' + e)
              .classed('active', true)
            const callback = () => { _tef.updateSelectedSamples() }
            getDataScatterplot(n, callback)
            const value = (div.select('#' + thisDim + 'Dim_' + n).selectAll('.active').node().id).substring(3)
            d3
              .selectAll('#' + thisDim + 'Dim_' + n + '_label')
              .html(thisDim + ' (' + value + ')')

          })
          .classed('active', active)
          .html(e)
      })
      const value = (d3.select('#' + thisDim + 'Dim_' + n).selectAll('.active').node().id).substring(3)
      div
        .selectAll('#' + thisDim + 'Dim_' + n + '_label')
        .html(thisDim + ' (' + value + ')')
    })
  }

  scatterplot.setHiddenOpacity = function () {
    const type = d3.selectAll('.scatter-view:checked').node().value
    if (type == 'all') _hiddenOpacity = 0.05
    else _hiddenOpacity = 0
    return scatterplot
  }
  return scatterplot
}
