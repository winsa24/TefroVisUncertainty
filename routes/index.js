// Require
const express = require('express');
const googleTrends = require('google-trends-api');

// Router
const router = express.Router();

const {
    init,
    getAllVolcanoes,
    getAllEvents,
    getSamples,
    getExtent,
    getMaterialByAuthors,
    getSamplesCSV
} = require('../controllers/index');

router
    .get('/', init)
    .get('/api/all-volcanoes', getAllVolcanoes)
    .get('/api/all-events', getAllEvents)
    .get('/api/samples', getSamples)
    .get('/api/extent', getExtent)
    .get('/api/material-by-authors', getMaterialByAuthors)
    .get('/api/download', getSamplesCSV)

module.exports = router;