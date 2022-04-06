const csv = require('csv-parser');
const fs = require('fs');
var db = require("../database.js")
const CsvParser = require("json2csv").Parser;

const samples = []
const events = {}
const volcanoes = {}
var volcanoes_ordered = []

exports.init = async (req, res) => {
    try {
        return res.render('index.ejs');
    } catch (error) {
        if (error) throw error;
    }
}

exports.getAllVolcanoes = async (req, res) => {
    var sql = "select * from volcano order by Latitude desc"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
}

exports.getAllEvents = async (req, res) => {
    var query = req.query;
    var sql = "select * from event "
    if ('volcan' in query)
        sql += "where Volcano like '" + query.volcan + "'"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
}
exports.getSamples = async (req, res) => {
    var query = req.query;
    var sql = "select * from sample "
    if ('volcano' in query && !('event' in query)) {
        sql += "where Volcano like '" + query.volcano + "'"
    } else if ('volcano' in query && 'event' in query) {
        sql += "where Volcano like '" + query.volcano + "' and Event like '" + query.event + "'"
    } else {
        // TESTING, I THINK I SHOULD NOT NEED THIS
        sql += "limit 10"
    }
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
}

exports.getSamplesCSV = async (req, res) => {

    var query = req.query;
    const columns = ['Volcano', 'Location', 'Event', 'Vei', 'Magnitude', 'Comments', 'ISGN', 'Flag', 'FlagDescription', 'TypeOfAnalysis', 'Latitude', 'Longitude', 'DOI', 'Map', 'TypeOfRegister', 'MeasuredMaterial', 'TypeOfSection', 'SectionID', 'SubSectionID', 'SubSection_DistanceFromTop', 'HistoricalAge', 'RadiocarbonLabCode', '"14C_Age"', '"14C_Age_Num"', '"14C_Age_Error"', '"14C_Age_Error_Num"', 'StratigraphicPosition', '"40Ar39Ar_Age"', '"40Ar39Ar_Age_Error"', 'DepositColor', 'DepositThickness_cm', 'GrainSize_min_mm', 'GrainSize_max_mm', 'MeasurementRun', 'Authors', 'AnalyticalTechnique', 'SampleID', 'SampleObservationID', 'SampleObservation_distance_to_regression', 'SiO2', 'TiO2', 'Al2O3', 'FeO', 'Fe2O3', 'Fe2O3T', 'FeOT', 'MnO', 'MgO', 'CaO', 'Na2O', 'K2O', 'P2O5', 'Cl', 'LOI', 'Total', 'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'Pb', 'Th', 'U', '"87Sr_86Sr"', '"2SE_87Sr_86Sr"', '"143Nd_144Nd"', '"2SE_143Nd_144Nd"'];
    var sql = "select " + columns.join(', ') + " from sample "
    if ('ve' in query){
        selectedVE = query['ve']
        sql += "WHERE "
        selectedVE.forEach(ve => {
            separated = ve.split('*')
            sql += "(Volcano like '" + separated[0] + "'  AND Event == '" + separated[1] +"') OR"
        })   
        sql = sql.slice(0, -2)     
    }
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const csvParser = new CsvParser({ columns });
        const csvData = csvParser.parse(rows);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=tutorials.csv");
        res.status(200).end(csvData);
    });
}

exports.getExtent = async (req, res) => {
    var query = req.query;
    var x = query.x
    var y = query.y
    var sql = 'select MIN("' + x + '") as min_x, MAX("' + x + '") as max_x, MIN("' + y + '")as min_y,'
    sql += ' MAX("' + y + '") as max_y from sample where "' + x + '" != "" and "' + y + '" != "" '
    console.log(sql)
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
}


exports.getMaterialByAuthors = async (req, res) => {
    var query = req.query;
    var v = query.volcano
    var e = query.event
    var sql = "select * from material_by_authors where Volcano == '" + v + "' AND Event == '" + e + "'"
    var params = []
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
}

exports.getFilteredInfo = async (req, res) => {
    con
    try {
        return res.render('index.ejs', {
            success: true,
            data: {
                'volcanoes': volcanoes_ordered,
                'events': events
            }
        });
    } catch (error) {
        if (error) throw error;
    }
}