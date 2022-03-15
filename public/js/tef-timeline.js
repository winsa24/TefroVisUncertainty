import { replaceAll, mouseOver, mouseOut } from './tef-utils.js'

export default function timeline() {
  var timeline = {}
  var _ctx
  var _ctxFocus
  var _minAge14C
  var _maxAge14C
  var _tef
  var _xFocusScale
  var _yFocusScale

  // INITIALIZATION
  timeline.init = function (tef) {
    _tef = tef
    _ctx = {
      w: 600,
      h: 850,
      vmargin: 2,
      hmargin: 10,
      timeParser: d3.timeParse('%Y-%m-%d'),
      timeAxisHeight: 10,
    }
    _ctxFocus = {
      w: 350,
      h: 850,
      vmargin: 40,
      hmargin: 99,
      timeAxisHeight: 15,
    }
    _minAge14C = -15000
    _maxAge14C = 0
    return timeline
  }

  timeline.initTimeline = function (volcanoes, events) {

    const size = d3.select('#volcanoMap').node().getBoundingClientRect()
    const sizeTabs = d3.select('.nav-tabs').node().getBoundingClientRect()
    _ctx.w = size.width - _ctx.hmargin
    _ctx.h = size.height - sizeTabs.height - 20
    //d3.selectAll('#focus-timeline').style('width', window.innerWidth / 3)
    _ctxFocus.w = 1000 //window.innerWidth/5 * 2
    _ctxFocus.h = size.height - sizeTabs.height - 70

    const left = (_ctx.w - 150) / 2
    d3
      .select('#timeline')
      .append('div')
      .style('float', 'left')
      .style('display', 'inline-block')
      .style('font-size', '10px')
      .style('color', '#212529')
      .style('position', 'relative')
      .style('left', left + 'px')
      .html('14'.sup() + 'C years BP')

    // CREATE SVG CONTAINER
    var svg = d3.select('#timeline').append('svg')
    //svg.style('position', 'relative')
    svg.attr('width', _ctx.w)
    svg.attr('height', _ctx.h + 20)
    svg.style('margin-top', 10)
    svg.style('margin-left', _ctx.hmargin / 2)

    // ADD TOOLTIP
    const div = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)

    const BAND_H = (_ctx.h - _ctx.timeAxisHeight) / volcanoes.length

    // ADD X SCALE
    var xScale = d3.scaleLinear()
      .domain([-15000, 0])
      .range([0, _ctx.w - 150])

    var xAxis = d3.axisTop()
      .scale(xScale)
      .tickFormat((d) => Math.abs(d))


    svg
      .append('g')
      .attr('transform', 'translate(' + _ctx.hmargin + ',25)')
      .call(xAxis)

    // ADD VOLCANO CONTAINER
    var volcanosGroup = svg
      .append('g')
      .attr('transform', 'translate(0, 25)')
      .selectAll('.timeContainer')
      .data(volcanoes)
      .enter()
      .append('g')
      .attr('class', 'timeContainer')
      .attr('transform', function (d, i) {
        return (
          'translate(' +
          _ctx.hmargin +
          ',' +
          (i * BAND_H + 1 + _ctx.timeAxisHeight + 5) +
          ')'
        )
      })
      .attr('id', function (d) {
        return replaceAll(d.Name, ' ', '-')
      })

    volcanosGroup
      .append('line')
      .attr('class', 'line-container')
      .attr('x1', 0)
      .attr('y1', _ctx.timeAxisHeight)
      .attr('x2', _ctx.w - 150)
      .attr('y2', _ctx.timeAxisHeight)
      .style('stroke', 'gray')
      .style('fill', 'none')

    volcanosGroup
      .append('text')
      .style('font-size', '10px')
      .attr('x', _ctx.w - 150 + 10)
      .attr('y', _ctx.timeAxisHeight / 1.3)
      .text(function (d) {
        return d.Name
      })
      .on('click', (e, d) => {
        _tef.selectVolcano(d.Name, true)
      })

    // ADD EVENTOS RECTANGLES
    var timeIntervals = volcanosGroup
      .selectAll('.timeRect')
      .data(function (d) {
        var events_volcan = events.filter(
          (e) =>
            e.Volcano == d.Name &&
            e.MinAge14C &&
            e.MaxAge14C &&
            e.Name !== 'Unknown',
        )
        events_volcan.forEach((e) => (e.Color = d.Color))
        return events_volcan
      })
      .enter()
    timeIntervals
      .append('rect')
      .attr('class', 'rectevento')
      .attr('x', function (d) {
        return xScale(d.MinAge14C)
      })
      .attr('y', 0)
      .attr('width', function (d) {
        return xScale(d.MaxAge14C) - xScale(d.MinAge14C)
      })
      .attr('height', _ctx.timeAxisHeight)
      .attr('fill', '#525252')
      .attr('opacity', 0.5)
      .on('mouseenter', (e, d, i) => { mouseOver('event', d, e) })
      .on('mouseout', () => { mouseOut() })
      .on('click', (e, d) => { _tef.selectEvent(d.Volcano, d.Name) })
    //})
    timeline.initFocusTimeline()
    return timeline
  }

  timeline.initFocusTimeline = function () {
    var svg = d3.select('#focus-timeline').append('svg')
    svg.attr('width', _ctxFocus.w + _ctxFocus.hmargin)
    svg.attr('height', _ctxFocus.h + _ctxFocus.vmargin)
    const main_g = svg.append('g')
    main_g.attr(
      'transform',
      `translate(1, ${_ctxFocus.vmargin})`,
    )

    _yFocusScale = d3.scaleLinear()
      .domain([_minAge14C - 200, _maxAge14C + 200])
      .range([_ctxFocus.h - _ctxFocus.vmargin, 0])

    _xFocusScale = d3.scalePow().exponent(5).domain([1, 6]).range([40, 100])
    let l = ' 14C AP'
    var yAxis = d3.axisLeft()
      .scale(_yFocusScale)
      .tickFormat((d) => Math.abs(d) + l)
    d3
      .select('#focus-timeline-axis')
      .append('svg')
      .attr('width', 100)
      .attr('height', _ctxFocus.h)
      .append('g')
      .attr('transform', `translate(${_ctxFocus.hmargin}, ${_ctxFocus.vmargin})`)
      .call(yAxis)
    main_g.append('g').attr('id', 'events')
  }

  // UPDATES AFTER USER d3.selectION
  timeline.updateSelectedVolcano = function (
    volcan,
    eventsData,
    events,
    allEvents,
    muestras,
    color,
    order
  ) {
    if (muestras != undefined) {
      addEvents(volcan, eventsData, allEvents, muestras, color, order)
    } else {
      removeEvents(volcan)
    }
    const name = replaceAll(volcan, ' ', '-')
    const volcanoG = d3.selectAll('#timeline')
      .selectAll('svg')
      .selectAll('#' + name)
    volcanoG
    if (events.length > 0) {
      const textGSize = volcanoG.select('text').node().getBoundingClientRect()
      volcanoG
        .append('rect')
        .attr('class', 'volcanoSelectedRect')
        .attr('x', _ctx.w - 150 + 10 - 2)
        .attr('y', -4)
        .attr('width', textGSize.width + 4)
        .attr('height', textGSize.height + 2)
        .style('fill', 'none')
        .style('stroke', color)
        .lower()
      volcanoG
        .select('.line-container')
        .style('stroke', color)
        .style('stroke-width', 2)
      d3.selectAll('.rectevento')
        .filter((d) => d.Volcano == volcan && events.indexOf(d.Name) >= 0)
        .attr('fill', (d) => d.Color)
    } else {
      volcanoG
        .selectAll('.volcanoSelectedRect')
        .remove()
      volcanoG
        .select('.line-container')
        .style('stroke', 'gray')
        .style('stroke-width', 1)
      d3.selectAll('.rectevento')
        .filter((d) => d.Volcano == volcan)
        .attr('fill', '#525252')
    }
  }
  timeline.updateSelectedEvents = function (volcan, events, isSelected) {
    d3.selectAll('.rectevento')
      .filter((d) => d.Volcano == volcan)
      .attr('fill', (d) => {
        if (events.indexOf(d.Name) >= 0) return d.Color
        else return '#525252'
      })

    if (events.length > 0)
      d3.select('#timeline')
        .selectAll('svg')
        .selectAll('#' + volcan)
        .selectAll('.line-container')
        .classed('rect-d3.selected', true)
    else
      d3.select('#timeline')
        .selectAll('svg')
        .selectAll('#' + volcan)
        .selectAll('.line-container')
        .classed('rect-d3.selected', false)
    d3.selectAll('.timeRectFocus_' + replaceAll(volcan, ' ', '_')).style(
      'visibility',
      'hidden',
    )
    events.forEach((evento) => {
      d3.selectAll(
        '.timeRectFocus_' +
        replaceAll(volcan, ' ', '_') +
        '_' +
        replaceAll(evento, ' ', '_'),
      ).style('visibility', 'visible')
    })
  }

  function addEvents(volcan, eventsDataOri, events, muestras, color, order) {
    const volcanName = replaceAll(volcan, ' ', '_')
    var data = []
    const div = d3.select('.tooltip')
    var dataEvents = {}
    for (let eventoName in events) {
      const e = events[eventoName]
      if (e == 'Unknown') {
        continue
      }
      if (!(volcan in dataEvents)) {
        dataEvents[volcan] = []
      }
      const muestras_evento = []
      muestras.forEach((m) => {
        if (m.Event != e || m['14C_Age_Num'] == -1) return
        m.Color = color
        muestras_evento.push(m)
      })
      const eventOri = eventsDataOri[e]
      const tmp = {}
      tmp.Magnitude = eventOri.Magnitude
      tmp.MinAge14C = eventOri.MinAge14C
      tmp.MaxAge14C = eventOri.MaxAge14C
      tmp.Vei = eventOri.Vei
      tmp.Volcano = eventOri.Volcano
      tmp.Name = e
      tmp.Muestras = muestras_evento
      tmp.Color = color
      data.push(tmp)
      dataEvents[volcan].push(tmp)
    }
    var svg = d3.select('#focus-timeline').selectAll('svg').selectAll('#events')
    var n = svg.selectAll('.volcan-focus').size()
    for (let evento in dataEvents) {
      const eventoG = svg
        .selectAll('.nothing')
        .data([{ 'name': volcan, 'order': order }])
        .enter()
        .append('g')
        .attr('class', 'volcan-focus')
        .attr('id', 'focus_g_' + evento)
        .attr('order', order)
        .attr('transform', 'translate(' + n * 100 + ', 0)')

      // Reorder volcanos by latitude
      const orderedGroups = d3
        .select('#focus-timeline')
        .selectAll('.volcan-focus')
        .sort(function (a, b) {
          return a.order - b.order;
        });
      orderedGroups.each(function(g, index) {
        d3
          .select(this)
          .attr('transform', 'translate(' + index * 100 + ', 0)')
      })
      eventoG
        .append('rect')
        .attr('width', 100)
        .attr('height', _ctxFocus.h - _ctxFocus.vmargin)
        .style('stroke', 'black')
        .style('fill', 'none')

      var label = evento.substring(0, 10)
      if (evento.length > 10) label += '...'
      eventoG
        .append('text')
        .text(label)
        .attr('transform', 'translate(0, -10)')
        .on('mouseover', (e, d) => {
          mouseOver('label', evento, e)
        })
        .on('mouseout', () => {
          mouseOut()
        })
      //.attr('transform', 'rotate(-20)')
      const dateG = eventoG.append('g').attr('id', 'focus_events_' + evento)
      // ADD EVENTOS POR VOLCAN
      var timeIntervals = dateG
        .selectAll('.timeRectFocus_' + volcanName)
        .data(dataEvents[evento])
        .enter()
        .append('g')
        .attr('class', (d) => {
          return (
            'timeRectFocus_' +
            replaceAll(d.Volcano, ' ', '_') +
            ' timeRectFocus_' +
            volcanName +
            '_' +
            replaceAll(d.Name, ' ', '_')
          )
        })
        .style('visibility', (d) => {
          return 'hidden'
        })

      timeIntervals
        .append('rect')
        .attr('y', function (d) {
          return _yFocusScale(d.MaxAge14C)
        })
        .attr('x', (d) => {
          return 0
        })
        .attr('height', function (d) {
          return _yFocusScale(d.MinAge14C) - _yFocusScale(d.MaxAge14C)
        })
        .attr('width', (d) => {
          if (d.Vei == -1 || d.Vei == '') {
            return 20
          } else {
            return _xFocusScale(d.Vei)
          }
        })
        .style('fill', (d) => d.Color)
        .style('opacity', 0.3)
        .on('mouseover', (e, d) => {
          mouseOver('event', d, e)
        })
        .on('mouseout', () => {
          mouseOut()
        })
        .on('click', (e, d) => {
          _tef.d3.selectEvento(d.Volcano, d.Event)
        })

      timeIntervals
        .selectAll('.focus-interval')
        .data((d) => d.Muestras)
        .enter()
        .append('line')
        .attr('y1', function (d) {
          return _yFocusScale(d['14C_Age_Num'])
        })
        .attr('y2', function (d) {
          return _yFocusScale(d['14C_Age_Num'])
        })
        .attr('x1', 0)
        .attr('x2', (d) => {
          if (d.Vei == -1 || d.Vei == '') {
            return 20
          } else {
            return _xFocusScale(d.Vei)
          }
        })
        .style('stroke', (d) => d.Color)
        .style('stroke-width', 2)
        .on('mouseover', (e, d) => {
          mouseOver('sample', d, e)
        })
        .on('mouseout', () => {
          mouseOut()
        })

      // MUESTRAS UNKNOWN
      timeIntervals
        .selectAll('.unknown-muestras')
        .data((d) => {
          const tmp = []
          muestras.forEach((m) => {
            if (m.Volcano == d.Volcano && m.Event == 'Unknown') {
              if (!isNaN(m['14C_Age_Num']) && m['14C_Age_Num'] != '') {
                tmp.push(m)
              }
            }
          })
          return tmp
        })
        .enter()
        .append('line')
        .attr('y1', function (d) {
          return _yFocusScale(d['14C_Age_Num'])
        })
        .attr('y2', function (d) {
          return _yFocusScale(d['14C_Age_Num'])
        })
        .attr('x1', 0)
        .attr('x2', (d) => {
          if (d.Vei == -1 || d.Vei == '') {
            return 20
          } else {
            return _xFocusScale(d.Vei)
          }
        })
        .style('stroke', '#7e7e7e')
        .style('stroke-width', 2)
        .on('mouseover', (e, d) => {
          mouseOver('sample', d, e)
        })
        .on('mouseout', () => {
          mouseOut()
        })
    }
  }
  function removeEvents(volcan) {
    const volcanoName = replaceAll(volcan, ' ', '_')
    //d3.selectAll('.timeRectFocus_' + volcanName).remove()
    d3.selectAll('#focus_g_' + volcanoName).remove()
    _tef.updateFocusTimeline()
  }
  return timeline
}
