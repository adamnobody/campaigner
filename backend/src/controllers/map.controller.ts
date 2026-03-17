import { Request, Response } from 'express';
import { mapService } from '../services/map.service.js';
import { createMapSchema, updateMapSchema, createMarkerSchema, updateMarkerSchema } from '@campaigner/shared';

export class MapController {
  // ==================== Карты ====================

  /**
   * GET /api/projects/:projectId/maps/root
   * Получить корневую карту проекта
   */
  async getRootMap(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const pid = parseInt(projectId);

      const map = mapService.getRootMap(pid);
      
      res.json({
        success: true,
        data: map,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/maps/:mapId
   * Получить карту по ID
   */
  async getMapById(req: Request, res: Response): Promise<void> {
    try {
      const { mapId } = req.params;
      const mid = parseInt(mapId);

      const map = mapService.getMapById(mid);
      if (!map) {
        res.status(404).json({
          success: false,
          error: 'Карта не найдена',
        });
        return;
      }

      res.json({
        success: true,
        data: map,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/projects/:projectId/maps/tree
   * Получить иерархию всех карт проекта
   */
  async getMapTree(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const pid = parseInt(projectId);

      const maps = mapService.getMapTree(pid);

      res.json({
        success: true,
        data: maps,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/maps
   * Создать новую карту
   */
  async createMap(req: Request, res: Response): Promise<void> {
    try {
      const validated = createMapSchema.parse(req.body);
      const map = mapService.createMap(validated);

      res.status(201).json({
        success: true,
        data: map,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/maps/:mapId
   * Обновить карту
   */
  async updateMap(req: Request, res: Response): Promise<void> {
    try {
      const { mapId } = req.params;
      const mid = parseInt(mapId);

      const map = mapService.getMapById(mid);
      if (!map) {
        res.status(404).json({
          success: false,
          error: 'Карта не найдена',
        });
        return;
      }

      const validated = updateMapSchema.parse(req.body);
      const updated = mapService.updateMap(mid, validated);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/maps/:mapId/image
   * Загрузить изображение карты
   */
  async uploadMapImage(req: Request, res: Response): Promise<void> {
    try {
      const { mapId } = req.params;
      const mid = parseInt(mapId);

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Файл не загружен',
        });
        return;
      }

      const map = mapService.uploadMapImage(mid, req.file);

      res.json({
        success: true,
        data: map,
      });
    } catch (error: any) {
      res.status(error.message === 'Карта не найдена' ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/maps/:mapId
   * Удалить карту
   */
  async deleteMap(req: Request, res: Response): Promise<void> {
    try {
      const { mapId } = req.params;
      const mid = parseInt(mapId);

      const map = mapService.getMapById(mid);
      if (!map) {
        res.status(404).json({
          success: false,
          error: 'Карта не найдена',
        });
        return;
      }

      mapService.deleteMap(mid);

      res.json({
        success: true,
        message: 'Карта удалена',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // ==================== Маркеры ====================

  /**
   * GET /api/maps/:mapId/markers
   * Получить все маркеры карты
   */
  async getMarkers(req: Request, res: Response): Promise<void> {
    try {
      const { mapId } = req.params;
      const mid = parseInt(mapId);

      const markers = mapService.getMarkersByMapId(mid);

      res.json({
        success: true,
        data: markers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/maps/:mapId/markers
   * Создать маркер на карте
   */
  async createMarker(req: Request, res: Response): Promise<void> {
    try {
      const { mapId } = req.params;
      const mid = parseInt(mapId);

      const map = mapService.getMapById(mid);
      if (!map) {
        res.status(404).json({
          success: false,
          error: 'Карта не найдена',
        });
        return;
      }

      const validated = createMarkerSchema.parse(req.body);
      const marker = mapService.createMarker(mid, validated);

      res.status(201).json({
        success: true,
        data: marker,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/markers/:markerId
   * Обновить маркер
   */
  async updateMarker(req: Request, res: Response): Promise<void> {
    try {
      const { markerId } = req.params;
      const mid = parseInt(markerId);

      const marker = mapService.getMarkerById(mid);
      if (!marker) {
        res.status(404).json({
          success: false,
          error: 'Маркер не найден',
        });
        return;
      }

      const validated = updateMarkerSchema.parse(req.body);
      const updated = mapService.updateMarker(mid, validated);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/markers/:markerId
   * Удалить маркер
   */
  async deleteMarker(req: Request, res: Response): Promise<void> {
    try {
      const { markerId } = req.params;
      const mid = parseInt(markerId);

      const marker = mapService.getMarkerById(mid);
      if (!marker) {
        res.status(404).json({
          success: false,
          error: 'Маркер не найден',
        });
        return;
      }

      mapService.deleteMarker(mid);

      res.json({
        success: true,
        message: 'Маркер удалён',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const mapController = new MapController();