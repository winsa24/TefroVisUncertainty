import map from './tef-map.js'
import timeline from './tef-timeline.js'
import table from './tef-table.js'
import scatterplot from './tef-scatterplot.js'
import { loading, loading_init, ready, ready_init } from './tef-utils.js'

export default function tef() {
  var tef = {}
  var _data
  var _map
  var _timeline
  var _table
  var _scatterplot
  var _selectedVolcanoes
  var _ndx
  //var _volcanoesEvents
  var _samples

  // INITIALIZATION
  tef.init = function () {
    loading_init()
    Promise.all([
      d3.json('/api/all-volcanoes'),
      d3.json('/api/all-events'),
      d3.csv('/data/TephraDataBase_renormalizado_distance_to_fit.csv'),
    ])
      .then(function (data_raw) {
        const volcanoes = data_raw[0].data
        const events = data_raw[1].data
        _selectedVolcanoes = {}
        _samples = data_raw[2]

        _ndx = crossfilter(_samples)
        /*_volcanoesEvents = _ndx.dimension(function (d) {
          return [d['Volcano'], d['Event'], d['Flag']]
        }).filter(
          function (d) {
            return d[2] != 'Outlier'
          })*/
        volcanoes.forEach((v, index) => {
          _selectedVolcanoes[v.Name] = {}
          _selectedVolcanoes[v.Name].isSelected = false
          _selectedVolcanoes[v.Name].allEvents = []
          _selectedVolcanoes[v.Name].events = []
          _selectedVolcanoes[v.Name].color = v.Color
          _selectedVolcanoes[v.Name].eventsData = {}
          _selectedVolcanoes[v.Name].order = index;
        })
        for (let index in events) {
          let e = events[index]
          let v = e.Volcano
          if (!(v in _selectedVolcanoes)) continue
          _selectedVolcanoes[v].allEvents.push(e.Name)
          _selectedVolcanoes[v].eventsData[e.Name] = e
        }
        _map = map().init(tef).addVolcanoes(volcanoes)
        _timeline = timeline().init(tef).initTimeline(volcanoes, events)
        _table = table().init(tef)
        _scatterplot = scatterplot().init(
          tef,
          tef.getElements(),
          _selectedVolcanoes,
          _ndx,
        )
        var tooltip = d3.select('body')
          .append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0)
        tef.addButtonListerners()
        ready_init()
      })
  }

  tef.addButtonListerners = function () {
    d3
      .select('#resetSelection')
      .on('click', () => {
        tef.resetSelection()
      })
    d3
      .select('#downloadSelection')
      .on('click', () => {
        tef.downloadDataset(true)
      })
    d3
      .select('#downloadAllDataset')
      .on('click', () => {
        tef.downloadDataset(false)
      })
  }
  tef.resetSelection = function () {
    for (let volcan in _selectedVolcanoes) {
      if (_selectedVolcanoes[volcan].isSelected) {
        _selectedVolcanoes[volcan].isSelected = false
        _selectedVolcanoes[volcan].events = []
        tef.updateSelectedVolcano(volcan)
      }
    }
  }

  tef.downloadDataset = function (selections) {
    // TODO: is there a prettier way to do this?
    var url = '/api/download?'
    if (selections) {
      for (let volcan in _selectedVolcanoes) {
        if (_selectedVolcanoes[volcan].isSelected) {
          _selectedVolcanoes[volcan].events.forEach(e => {
            url += '&ve=' + volcan + '*' + e
          })
        }
      }
    }
    fetch(url)
      .then(resp => resp.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'tephra_samples.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => alert('oh no something happened!'));

  }

  tef.getRawData = function () {
    return _samples
  }

  // VOLCANO SELECTION
  tef.selectVolcano = function (volcan, allevents = false) {
    _selectedVolcanoes[volcan].isSelected = !_selectedVolcanoes[volcan].isSelected
    const isSelected = _selectedVolcanoes[volcan].isSelected
    if (!isSelected) {
      _selectedVolcanoes[volcan].events = []
      tef.updateSelectedVolcano(volcan)
    } else {
      if (allevents) {
        _selectedVolcanoes[volcan].events = _selectedVolcanoes[volcan].allEvents
      }
      loading()
      var url = '/api/samples?volcano=' + volcan
      d3.json(url).then((muestras) => {
        ready()
        _map.updateSelectedVolcano(volcan, true, muestras.data)
        _timeline.updateSelectedVolcano(
          volcan,
          _selectedVolcanoes[volcan].eventsData,
          _selectedVolcanoes[volcan].events,
          _selectedVolcanoes[volcan].allEvents,
          muestras.data,
          _selectedVolcanoes[volcan].color,
          _selectedVolcanoes[volcan].order
        )
        _table.updateSelectedVolcano(
          volcan,
          isSelected,
          _selectedVolcanoes[volcan].allEvents,
          _selectedVolcanoes[volcan].events,
          _selectedVolcanoes[volcan].color,
          _selectedVolcanoes[volcan].order
        )
        _scatterplot.updateSelectedVolcano(_selectedVolcanoes)

        // UPDATE VOLCANO SELECTION IN OTHER VIEWS
        _map.updateSelectedEvents(volcan, _selectedVolcanoes[volcan].events)
        _timeline.updateSelectedEvents(
          volcan,
          _selectedVolcanoes[volcan].events,
        )
        /*_table.updateSelectedEvents(
          volcan,
          _selectedVolcanoes[volcan].events,
          _selectedVolcanoes[volcan].color,
        )*/
        _scatterplot.updateSelectedEvents(_selectedVolcanoes)
      })
    }
  }

  // EVENT SELECTION
  tef.selectEvent = function (volcan, evento) {
    var index = _selectedVolcanoes[volcan].events.indexOf(evento)

    var callback = () => {
      _map.updateSelectedEvents(volcan, _selectedVolcanoes[volcan].events)
      _timeline.updateSelectedEvents(
        volcan,
        _selectedVolcanoes[volcan].events,
      )
      _table.updateSelectedEvents(
        volcan,
        _selectedVolcanoes[volcan].events,
        _selectedVolcanoes[volcan].color,
      )
      _scatterplot.updateSelectedEvents(_selectedVolcanoes)
    }

    var wasVolcanSelected = _selectedVolcanoes[volcan].events.length > 0
    if (index > -1) _selectedVolcanoes[volcan].events.splice(index, 1)
    else _selectedVolcanoes[volcan].events.push(evento)

    // If there is no event selected or it is the first event selected
    if (
      _selectedVolcanoes[volcan].events.length == 0 ||
      (!wasVolcanSelected && _selectedVolcanoes[volcan].events.length == 1)
    )
      tef.selectVolcano(volcan)
    callback()
    return
  }

  tef.updateSelectedSamples = function () {
    _scatterplot.updateSelectedEvents(_selectedVolcanoes)
    _map.updateSelectedSamples(_selectedVolcanoes)
  }

  tef.updateSelectedVolcano = function (volcan) {
    // UPDATE VOLCANO SELECTION IN OTHER VIEWS
    _map.updateSelectedVolcano(volcan, false)
    _timeline.updateSelectedVolcano(
      volcan,
      _selectedVolcanoes[volcan].eventsData,
      _selectedVolcanoes[volcan].events,
    )
    _table.updateSelectedVolcano(volcan)
    _scatterplot.updateSelectedVolcano(_selectedVolcanoes)

    // UPDATE VOLCANO SELECTION IN OTHER VIEWS
    _map.updateSelectedEvents(volcan, _selectedVolcanoes[volcan].events)
    _timeline.updateSelectedEvents(
      volcan,
      _selectedVolcanoes[volcan].events,
    )
    _table.updateSelectedEvents(
      volcan,
      _selectedVolcanoes[volcan].events,
      _selectedVolcanoes[volcan].color,
    )
    _scatterplot.updateSelectedEvents(_selectedVolcanoes)
  }
  tef.getElements = function () {
    return [
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
  }

  tef.getElementLabel = function (el) {
    const perc = [
      'SiO2', 'TiO2', 'Al2O3', 'FeOT', 'MnO', 'MgO', 
      'CaO', 'Na2O','K2O', 'P2O5', 'Cl', 'LOI', 'Total']
    const ppm = ['Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Cs',
      'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd',
      'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf',
      'Ta', 'Pb', 'Th', 'U']
    //const noLabel = ['87Sr_86Sr', '143Nd_144Nd']
    var index = perc.indexOf(el)
    if (index >= 0) return ' (wt.%)'
    index = ppm.indexOf(el)
    if (index >= 0) return ' (ppm)'
    return ''
  }

  tef.isSelectionActive = function () {
    var oneSelected = false
    for (let volcano in _selectedVolcanoes) {
      oneSelected = oneSelected || _selectedVolcanoes[volcano].isSelected
    }
    return oneSelected
  }

  tef.updateFocusTimeline = function () {
    loading()
    d3.selectAll('.volcan-focus').remove()
    for (let volcan in _selectedVolcanoes) {
      if (_selectedVolcanoes[volcan].isSelected) {
        var url = '/api/muestras?volcan=' + volcan
        d3.json(url).then((muestras) => {
          ready()
          // UPDATE VOLCANO SELECTION IN OTHER VIEWS
          _timeline.updateSelectedVolcano(
            volcan,
            _selectedVolcanoes[volcan].eventsData,
            _selectedVolcanoes[volcan].events,
            _selectedVolcanoes[volcan].allEvents,
            muestras.data,
            _selectedVolcanoes[volcan].color,
          )
          // UPDATE VOLCANO SELECTION IN OTHER VIEWS
          _timeline.updateSelectedevents(
            volcan,
            _selectedVolcanoes[volcan].events,
          )
        })
      }
    }
  }

  return tef.init()
}

tef()