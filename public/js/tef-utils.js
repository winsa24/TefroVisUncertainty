var first_time = true;

function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
export function replaceAll(str, find, _replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), _replace)
}
export function hexToRGB(hex, opacity) {
  let r = 0, g = 0, b = 0;
  // handling 3 digit hex
  if (hex.length == 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
    // handling 6 digit hex
  } else if (hex.length == 7) {

    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  };
  return [+r / 255, +g / 255, +b / 255, opacity];
}

export function hexToRGBString(hex, opacity) {
  let rgb = hexToRGB(hex, opacity)
  return 'rgba(' + (rgb[0] * 255) + ',' + (rgb[1] * 255) + ',' + (rgb[2] * 255) + ',' + opacity + ')'
}

export function sampleTipText(d) {
  var tipText = '<h3 style="text-align: center;">Sample Point </h3>'

  tipText += '<h4> Information </h4>'
  tipText +=
    'Sample Point ID: <text class="titulo-tooltip">' +
    d.SampleObservationID +
    '</text><br/>'
  tipText +=
    'Sample ID: <text class="titulo-tooltip">' +
    d.SampleID +
    '</text><br/>'
  tipText +=
    'Measured material: <text class="titulo-tooltip">' +
    d.MeasuredMaterial +
    '</text><br/>'
  tipText +=
    'Age: <text class="titulo-tooltip">'
  if (d['14C_Age'] != '')
    tipText += d['14C_Age'] + ' ± ' + d['14C_Age_Error'] + '14'.sup() + 'C years BP'
  tipText += ' </text><br/>'
  tipText +=
    'Reference: <text class="titulo-tooltip">' +
    d.Authors +
    '</text><br/><br/>'

  tipText += '<h4> Interpretation </h4>'
  tipText +=
    'Volcano: <text class="titulo-tooltip">' + d.Volcano + '</text><br/>'
  tipText +=
    'Eruption: <text class="titulo-tooltip">' +
    d.Event +
    '</text><br/>'
  tipText +=
    'Magnitude: <text class="titulo-tooltip">' +
    d.Magnitude +
    '</text><br/>'
  tipText +=
    'VEI: <text class="titulo-tooltip">' + d.Vei + '</text><br/>'
  return tipText
}

function eventTipText(d) {
  var tipText = '<h3 style="text-align: center;"> Eruption ' + d.Name + '</h3>'
  tipText +=
    'Volcano: <text class="titulo-tooltip">' + d.Volcano + '</text><br/>'
  /*tipText +=
    'Eruption: <text class="titulo-tooltip">' +
    d.Name +
    '</text><br/>'*/
  tipText +=
    'Age range: <text class="titulo-tooltip">' +
    Math.abs(d.MinAge14C) +
    '—' +
    Math.abs(d.MaxAge14C) +
    ' 14'.sup() + 'C years BP</text><br/>'
  tipText +=
    'Magnitude: <text class="titulo-tooltip">' +
    (d.Magnitude ? d.Magnitude : '') +
    '</text><br/>'
  tipText +=
    'VEI: <text class="titulo-tooltip">' +
    (d.Vei ? d.Vei : '') +
    '</text><br/>'
  return tipText
}

function labelTipText(d) {
  var tipText = '<text class="titulo-tooltip">'
  tipText += d
  tipText += '</text>'
  return tipText
}

export function mouseOver(dataType, d, event) {
  d3
    .select('.tooltip')
    .transition()
    .duration(200)
    .style('opacity', 0.9)

  var tipText
  if (dataType == 'sample') {
    tipText = sampleTipText(d)
  } else if (dataType == 'event') {
    tipText = eventTipText(d)
  } else {
    tipText = labelTipText(d)
  }

  d3
    .select('.tooltip')
    .html(tipText)
    .style('left', event.pageX + 'px')
    .style('top', event.pageY - 28 + 'px')
}

export function mouseOut() {
  d3
    .select('.tooltip')
    .transition()
    .duration(500)
    .style('opacity', 0)
}

export function loading() {
  if(first_time) return
  d3.selectAll('.main-section').style('opacity', 0.7).style('pointer-events', 'none')
  d3.select('#tef-loading').style('visibility', 'visible')
}

export function loading_init() {
  d3.selectAll('.main-section').style('opacity', 0).style('pointer-events', 'none')
  d3.select('#tef-loading').style('visibility', 'visible')
}

export function ready() {
  if(first_time) return
  d3.selectAll('.main-section').style('opacity', 1).style('pointer-events', 'all')
  d3.selectAll('.tef-loading').style('visibility', 'hidden')
}
export function ready_init() {
  d3.select('#tef-loading').style('visibility', 'hidden')
  d3.selectAll('#tef-loading-init').style('visibility', 'visible')
  setTimeout(() => {
    d3.selectAll('#tef-loading-init').style('visibility', 'hidden')
    d3.selectAll('.main-section').style('opacity', 1).style('pointer-events', 'all')  
  }, 1500)  
  first_time = false;
}