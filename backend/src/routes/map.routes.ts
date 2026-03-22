import { Router } from 'express';
import multer from 'multer';
import { mapController } from '../controllers/map.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ==================== Карты ====================
router.get('/projects/:projectId/maps/root', (req, res) =>
  mapController.getRootMap(req, res)
);

router.get('/projects/:projectId/maps/tree', (req, res) =>
  mapController.getMapTree(req, res)
);

router.get('/maps/:mapId', (req, res) =>
  mapController.getMapById(req, res)
);

router.post('/maps', (req, res) =>
  mapController.createMap(req, res)
);

router.put('/maps/:mapId', (req, res) =>
  mapController.updateMap(req, res)
);

router.delete('/maps/:mapId', (req, res) =>
  mapController.deleteMap(req, res)
);

router.post('/maps/:mapId/image', upload.single('image'), (req, res) =>
  mapController.uploadMapImage(req, res)
);

// ==================== Маркеры ====================
router.get('/maps/:mapId/markers', (req, res) =>
  mapController.getMarkers(req, res)
);

router.post('/maps/:mapId/markers', (req, res) =>
  mapController.createMarker(req, res)
);

router.put('/markers/:markerId', (req, res) =>
  mapController.updateMarker(req, res)
);

router.delete('/markers/:markerId', (req, res) =>
  mapController.deleteMarker(req, res)
);

export default router;