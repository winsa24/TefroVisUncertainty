// This is a bit horrible, sorry future self

var sqlite3 = require('sqlite3').verbose()
const csv = require('csv-parser');
const fs = require('fs');


const DBSOURCE = "db.sqlite"

const elements = ['SiO2', 'TiO2', 'Al2O3', 'FeO', 'Fe2O3', 'Fe2O3T', 'FeOT', 'MnO', 'MgO', 'CaO', 'Na2O', 'K2O', 'P2O5', 'Cl', 'LOI', 'Total', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'Pb', 'Th', 'U', '87Sr_86Sr', '2SE_87Sr_86Sr', '143Nd_144Nd', '2SE_143Nd_144Nd']

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database
    console.error(err.message)
    throw err
  } else {
    console.log('Connected to the SQLite database.')
    createVolcanoes(db)
  }
});

let createVolcanoes = function (db) {
  const volcanoes = {}
  fs.createReadStream('./data/Volcanes.csv')
    .pipe(csv())
    .on('data', (row) => {
      volcanoes[row['Volcano']] = row
    })
    .on('end', () => {
      db.run(`CREATE TABLE volcano (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text, 
            Latitude real, 
            Longitude real, 
            Color text
            )`,
        (err) => {
          if (err) {
            // Table already created
          } else {
            console.log('Creating Volcanoes Table')
            // Table just created, creating some rows
            var insert = 'INSERT INTO volcano (Name, Latitude, Longitude, Color) VALUES (?,?,?,?)'
            var id = 1;
            for (let v in volcanoes) {
              volcan = volcanoes[v];
              db.run(insert, [volcan.Volcano, volcan.Latitude, volcan.Longitude, volcan.Color])
              volcan.id = id
              id += 1
            }
            console.log('Volcanoes table ready');
            createEvents(db, volcanoes)
          }
        });
    });
}


let createEvents = function (db, volcanoes) {
  const events = {}
  const extents = {}
  const measuredMaterial = {}
  const samples = []
  const authorsDOI = {}
  fs.createReadStream('./data/TephraDataBase_renormalizado_distances.csv')
    .pipe(csv())
    .on('data', (row) => {
      // COMPUTE EVENTS
      let v = row.Volcano
      let e = row.Event
      if (!(v in events)) {
        events[v] = {}
        extents[v] = {}
        measuredMaterial[v] = {}
      }
      if (!(e in events[v])) {
        events[v][e] = {}
        events[v][e].Event = e
        events[v][e].Volcano = v
        events[v][e].Ages14C = []
        events[v][e].Magnitudes = []
        events[v][e].Veis = []
        extents[v][e] = {}
        elements.forEach(el => {
          extents[v][e][el] = []
        })
        measuredMaterial[v][e] = {}
      }

      // COMPUTE EVENTS TIMELINES
      if (row['14C_Age'] !== '' && !isNaN(row['14C_Age'])) {
        const age14C = -(Number(row['14C_Age']))
        const ageError14C = Number(row['14C_Age_Error'])
        events[v][e].Ages14C.push(age14C - ageError14C)
        events[v][e].Ages14C.push(age14C + ageError14C)
      }

      // COMPUTE EVENTS MAGNITUDE
      let m = row.Magnitude
      if (m !== '' && !isNaN(m)) {
        events[v][e].Magnitudes.push(Number(m))
      }

      // COMPUTE EVENTS VEI
      let vei = row.Vei
      if (vei !== '' && !isNaN(vei)) {
        events[v][e].Veis.push(Number(vei))
      }

      // COMPUTE ELEMENTS EXTENT
      elements.forEach(el => {
        if (!row['Flag'].includes('Outlier') && row[el] != '' && !isNaN(row[el]))
          extents[v][e][el].push(row[el])
      })

      // COMPUTE MEASURED MATERIALS
      const authors = row.Authors
      if (!(authors in measuredMaterial[v][e])) {
        measuredMaterial[v][e][authors] = {}
        authorsDOI[authors] = row.DOI
      }
      var mat = row.MeasuredMaterial
      if (mat == '')
        mat = 'Unknown'
      if (!(mat in measuredMaterial[v][e][authors])) {
        measuredMaterial[v][e][authors][mat] = 0
      }
      measuredMaterial[v][e][authors][mat] += 1
      samples.push(row)
    })
    .on('end', () => {
      db.run(`CREATE TABLE event (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name text, 
            Volcano text,
            VolcanoID integer,
            MinAge14C real, 
            MaxAge14C real, 
            Magnitude real,
            Vei integer,
            FOREIGN KEY(VolcanoID) REFERENCES volcano(id)
            )`,
        (err) => {
          if (err) {
            // Table already created
          } else {
            console.log('Creating events table')
            var id = 1
            for (let v in events) {
              for (let e in events[v]) {
                const event = events[v][e];
                if (!(v in volcanoes))
                  continue
                events[v][e].MaxAge14C = Math.max(...event.Ages14C);
                events[v][e].MinAge14C = Math.min(...event.Ages14C);
                if (events[v][e].Magnitudes.length != 0) {
                  events[v][e].Magnitude = event.Magnitudes.reduce((a, b) => { return a + b; })
                  events[v][e].Magnitude = event.Magnitude / event.Magnitudes.length
                }
                if (events[v][e].Veis.length != 0) {
                  events[v][e].Vei = event.Veis.reduce((a, b) => { return a + b; })
                  events[v][e].Vei = event.Vei / event.Veis.length
                }
                var insert = 'INSERT INTO event (Name, Volcano, VolcanoID, MinAge14C, MaxAge14C, Magnitude, Vei) VALUES (?,?,?,?,?,?,?)'
                var id_volcan = volcanoes[v].id
                db.run(insert, e, v, id_volcan, events[v][e].MinAge14C, events[v][e].MaxAge14C, events[v][e].Magnitude, events[v][e].Vei)
                events[v][e].id = id
                id += 1
              }
            }
            console.log('Events table ready');
            createMeasuredMaterial(measuredMaterial, authorsDOI)
            createSamples(volcanoes, events, samples)
          }
        });
    });
}

let createMeasuredMaterial = function (measuredMaterial, authorsDOI) {
  db.run(`CREATE TABLE material_by_authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    Volcano text, 
    Event text, 
    Authors text,
    DOI text,
    MeasuredMaterial text, 
    Counted integer
    )`,
    (err) => {
      if (err) {
        console.log(err)
        // Table already created
      } else {
        console.log('Creating material_by_authors table')
        // Table just created, creating some rows
        var insert = 'INSERT INTO material_by_authors (Volcano, Event, Authors, DOI, MeasuredMaterial, Counted) VALUES (?,?,?,?,?,?)'
        for (let v in measuredMaterial) {
          for (let e in measuredMaterial[v]) {
            for (let authors in measuredMaterial[v][e]) {
              for (let mat in measuredMaterial[v][e][authors]) {
                db.run(insert, [v, e, authors, authorsDOI[authors], mat, measuredMaterial[v][e][authors][mat]])
              }
            }
          }
        }
        console.log('materials_authors table ready');
      }
    });
}

let createSamples = function (volcanes, eventos, muestras) {
  const columns = `Volcano text, Location text, Event text, Vei text, Magnitude real, Comments text, ISGN text, Flag text, FlagDescription text, TypeOfAnalysis text, Latitude real, Longitude real, DOI text, Map text, TypeOfRegister text, MeasuredMaterial text, TypeOfSection text, SectionID text, SubSectionID text, SubSection_DistanceFromTop text, HistoricalAge text, RadiocarbonLabCode text, "14C_Age" text, "14C_Age_Num" real, "14C_Age_Error" text, "14C_Age_Error_Num" real, StratigraphicPosition text, "40Ar39Ar_Age" text, "40Ar39Ar_Age_Error" text, DepositColor text, DepositThickness_cm text, GrainSize_min_mm text, GrainSize_max_mm text, MeasurementRun text, Authors text, AnalyticalTechnique text, SampleID text, SampleObservationID text, SampleObservation_distance_to_regression real, SiO2 real, TiO2 real, Al2O3 real, FeO real, Fe2O3 real, Fe2O3T real, FeOT real, MnO real, MgO real, CaO real, Na2O real, K2O real, P2O5 real, Cl real, LOI real, Total real, Rb real, Sr real, Y real, Zr real, Nb real, Cs real, Ba real, La real, Ce real, Pr real, Nd real, Sm real, Eu real, Gd real, Tb real, Dy real, Ho real, Er real, Tm real, Yb real, Lu real, Hf real, Ta real, Pb real, Th real, U real, "87Sr_86Sr" real, "2SE_87Sr_86Sr" real, "143Nd_144Nd" real, "2SE_143Nd_144Nd" real, VolcanoID integer, EventID integer,`
  const columns_clear = `Volcano, Location, Event, Vei, Magnitude, Comments, ISGN, Flag, FlagDescription, TypeOfAnalysis, Latitude, Longitude, DOI, Map, TypeOfRegister, MeasuredMaterial, TypeOfSection, SectionID, SubSectionID, SubSection_DistanceFromTop, HistoricalAge, RadiocarbonLabCode, "14C_Age", "14C_Age_Num", "14C_Age_Error", "14C_Age_Error_Num", StratigraphicPosition, "40Ar39Ar_Age", "40Ar39Ar_Age_Error", DepositColor, DepositThickness_cm, GrainSize_min_mm, GrainSize_max_mm, MeasurementRun, Authors, AnalyticalTechnique, SampleID, SampleObservationID, SampleObservation_distance_to_regression, SiO2, TiO2, Al2O3, FeO, Fe2O3, Fe2O3T, FeOT, MnO, MgO, CaO, Na2O, K2O, P2O5, Cl, LOI, Total, Rb, Sr, Y, Zr, Nb, Cs, Ba, La, Ce, Pr, Nd, Sm, Eu, Gd, Tb, Dy, Ho, Er, Tm, Yb, Lu, Hf, Ta, Pb, Th, U, "87Sr_86Sr", "2SE_87Sr_86Sr", "143Nd_144Nd", "2SE_143Nd_144Nd", VolcanoID, EventID`
  var sql_create = "CREATE TABLE sample (id INTEGER PRIMARY KEY AUTOINCREMENT,"
  sql_create += columns
  sql_create += 'FOREIGN KEY(VolcanoID) REFERENCES volcano(id), FOREIGN KEY(EventID) REFERENCES event(id))'

  const columns_clear_arr = columns_clear.split(",");
  db.run(sql_create,
    (err) => {
      if (err) {
        // Table already created
        console.log(err)
      } else {
        console.log('Creating samples table')
        muestras.forEach(m => {
          if (!(m.Volcano in volcanes) || !(m.Event in eventos[m.Volcano]))
            return
          var insert = 'INSERT INTO sample (' + columns_clear + ') VALUES ('
          for (let i = 0; i < columns_clear_arr.length - 1; i++) {
            insert += '?,'
          }
          insert += '?)'
          var edadNum = -1
          var errorEdadNum = -1
          if (m['14C_Age'] !== '' && !isNaN(m['14C_Age'])) {
            edadNum = -(Number(m['14C_Age']))
            errorEdadNum = Number(m['14C_Age_Error'])
          }
          db.run(insert,
            m.Volcano,
            m.Location,
            m.Event,
            m.Vei,
            m.Magnitude,
            m.Comments,
            m.ISGN,
            m.Flag,
            m.FlagDescription,
            m.TypeOfAnalysis,
            m.Latitude,
            m.Longitude,
            m.DOI,
            m['Map?'],
            m.TypeOfRegister,
            m.MeasuredMaterial,
            m.TypeOfSection,
            m.SectionID,
            m.SubSectionID,
            m.SubSection_DistanceFromTop,
            m.HistoricalAge,
            m.RadiocarbonLabCode,
            m['14C_Age'],
            edadNum,
            m['14C_Age_Error'],
            errorEdadNum,
            m.StratigraphicPosition,
            m['40Ar39Ar_Age'],
            m['40Ar39Ar_Age_Error'],
            m.DepositColor,
            m.DepositThickness_cm,
            m.GrainSize_min_mm,
            m.GrainSize_max_mm,
            m.MeasurementRun,
            m.Authors,
            m.AnalyticalTechnique,
            m.SampleID,
            m.SampleObservationID,
            m.SampleObservation_distance_to_regression,
            m.SiO2,
            m.TiO2,
            m.Al2O3,
            m.FeO,
            m.Fe2O3,
            m.Fe2O3T,
            m.FeOT,
            m.MnO,
            m.MgO,
            m.CaO,
            m.Na2O,
            m.K2O,
            m.P2O5,
            m.Cl,
            m.LOI,
            m.Total,
            m.Rb,
            m.Sr,
            m.Y,
            m.Zr,
            m.Nb,
            m.Cs,
            m.Ba,
            m.La,
            m.Ce,
            m.Pr,
            m.Nd,
            m.Sm,
            m.Eu,
            m.Gd,
            m.Tb,
            m.Dy,
            m.Ho,
            m.Er,
            m.Tm,
            m.Yb,
            m.Lu,
            m.Hf,
            m.Ta,
            m.Pb,
            m.Th,
            m.U,
            m['87Sr_86Sr'],
            m['2SE_87Sr_86Sr'],
            m['143Nd_144Nd'],
            m['2SE_143Nd_144Nd'],
            volcanes[m.Volcano].id,
            eventos[m.Volcano][m.Event].id,
            (err) => {
              if (err) {

              } else {

              }
            })
        })

        console.log('Samples table ready');
      }
    })
}

module.exports = db