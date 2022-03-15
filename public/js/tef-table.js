import { replaceAll, hexToRGBString, loading, ready } from './tef-utils.js'

export default function table() {
  var table = {}
  var _tef

  // INITIALIZATION
  table.init = function (tef) {
    _tef = tef
    return table
  }

  // UPDATE AFTER USER SELECTION
  table.updateSelectedVolcano = function (volcan, isSelected, allEvents, events, color, order) {
    if (isSelected) {
      addVolcanoSummary(volcan, allEvents, events, color, order)
    } else {
      removeVolcanoSummary(volcan)
    }
  }

  table.updateSelectedEvents = function (volcan, eventos, color) {
    var name = replaceAll(volcan, ' ', '-')
    d3.selectAll('.head_volcan_' + name).style(
      'background-color',
      hexToRGBString('#808080', 0.3),
    )
    eventos.forEach((e) => {
      name = replaceAll(volcan, ' ', '-') + '_' + replaceAll(e, ' ', '-')
      d3.selectAll('#head_' + name).style(
        'background-color',
        hexToRGBString(color, 0.3),
      )
    })
  }

  function addVolcanoSummary(volcan, allEvents, events, colorVolcano, orderVolcano) {
    const mainDiv = d3.select('#selectedVolcanoes')
      .selectAll('.nothing')
      .data([{ 'name': volcan, 'order': orderVolcano }])
      .enter()
      .append('div')
      .attr('id', 'summary_' + replaceAll(volcan, ' ', '-'))
      .attr('class', 'volcan-summary-table')
    mainDiv.append('h3').html(volcan + ' Volcano')

    // Reorder divs

    // Reorder volcanos by latitude
    const orderedGroups = d3
      .select('#selectedVolcanoes')
      .selectAll('.volcan-summary-table')
      .sort(function (a, b) {
        return a.order - b.order;
      });
    orderedGroups.each(function (g, index) {
      d3
        .select(this)
        .raise()
    })

    loading()
    allEvents.forEach((evento) => {
      d3
        .json('/api/material-by-authors?volcano=' + volcan + '&event=' + evento)
        .then((data) => {
          ready()
          var color = '#808080'
          if (events.indexOf(evento) >= 0) color = colorVolcano
          var eventSummary = getEventoSummary(data.data)
          if (eventSummary.localeCompare('') == 0) {
            return
          }
          const eventoName =
            replaceAll(volcan, ' ', '-') + '_' + replaceAll(evento, ' ', '-')

          const outerDiv = mainDiv.append('div').attr('class', 'card')

          const header = outerDiv
            .append('div')
            .attr('class', 'mb-0 head_volcan_' + replaceAll(volcan, ' ', '-'))
            .attr('id', 'head_' + eventoName)
            .style('background-color', hexToRGBString(color, 0.3))
          header
            .append('button')
            .attr('class', 'btn btn-link')
            .on('click', () => {
              _tef.selectEvent(volcan, evento)
            })
            .html(evento)

          header
            .append('a')
            .attr('id', 'id_b_' + eventoName)
            .attr('class', 'btn')
            .attr('data-bs-toggle', 'collapse')
            .attr('href', '#id_' + eventoName)
            .attr('role', 'button')
            .attr('aria-expanded', false)
            .attr('aria-controls', '#id_' + eventoName)
            .style('float', 'right')
            .html('+')

          outerDiv
            .append('div')
            .attr('id', 'id_' + eventoName)
            .attr('class', 'collapse')
            .append('div')
            .attr('class', 'card card-body')
            .html(eventSummary)
        })
    })
  }

  function removeVolcanoSummary(volcan) {
    var asdf = document.getElementById(
      'summary_' + replaceAll(volcan, ' ', '-'),
    )
    if (asdf !== null) {
      asdf.remove()
    }
  }

  function getEventoSummary(data) {
    var summary = ''
    const summary_dict = {}
    data.forEach(function (d) {
      if (!(d.Authors in summary_dict)) {
        summary_dict[d.Authors] = {}
        summary_dict[d.Authors]['DOI'] = d.DOI
        summary_dict[d.Authors]['material'] = {}
      }
      summary_dict[d.Authors]['material'][d.MeasuredMaterial] = d.Counted
    })
    var keys = Object.keys(summary_dict)
    keys.sort()
    //for (let ref in summary_dict) {
    keys.forEach((authors) => {

      if (summary_dict[authors].DOI !== "") {
        summary += '<b> <a href="' + summary_dict[authors].DOI + '" target="_blank">' + authors + '</a></b>'
      } else {
        summary += '<b>' + authors + '</b>'
      }

      for (let mat in summary_dict[authors]['material']) {
        summary += '<div style="text-indent: 30px">'
        summary += mat + ': ' + summary_dict[authors]['material'][mat] + '<br>'
        summary += '</div>'
      }
    })
    return summary
  }
  return table
}
