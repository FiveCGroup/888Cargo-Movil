const express = require('express');
const router = express.Router();
const QRController = require('../controllers/qrController');


router.get('/landing/:qrCode', QRController.obtenerInformacionLanding);
router.post('/analytics/view', QRController.registrarVisualizacion);

module.exports = router;