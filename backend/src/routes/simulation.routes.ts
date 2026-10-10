import { Router, Request, Response } from 'express';
import { simulationEngine } from '../services/simulation.service.js';
import { SimulationScenario } from '../models/simulation.types.js';

export const simulationRouter = Router();

// GET /api/simulation/status
simulationRouter.get('/status', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      simulation_speed: simulationEngine.getGlobalSpeed(),
      is_paused: simulationEngine.getIsPaused(),
      source: 'SIMULATED',
      timestamp: new Date().toISOString(),
      disclaimer: 'Software simulation of industrial weaving machine telemetry. Not connected to physical hardware.',
    },
  });
});

// POST /api/simulation/control
simulationRouter.post('/control', (req: Request, res: Response) => {
  const { speed, paused } = req.body;

  if (speed !== undefined) {
    if (![1, 5, 10].includes(speed)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_SPEED', message: 'Speed must be 1, 5, or 10.' } });
    }
    simulationEngine.setGlobalSpeed(speed);
  }

  if (paused !== undefined) {
    simulationEngine.setPaused(Boolean(paused));
  }

  return res.json({
    success: true,
    data: {
      simulation_speed: simulationEngine.getGlobalSpeed(),
      is_paused: simulationEngine.getIsPaused(),
    },
    message: 'Simulation control parameters updated.',
  });
});

// GET /api/simulation/machines
simulationRouter.get('/machines', (_req: Request, res: Response) => {
  const telemetryList = simulationEngine.getAllMachinesTelemetry();
  return res.json({ success: true, data: telemetryList });
});

// GET /api/simulation/machines/:id
simulationRouter.get('/machines/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const telemetry = simulationEngine.getMachineTelemetry(id);

  if (!telemetry) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Machine not found in simulation engine.' } });
  }

  return res.json({ success: true, data: telemetry });
});

// POST /api/simulation/machines/:id/scenario
simulationRouter.post('/machines/:id/scenario', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { scenario, reason } = req.body;

  const validScenarios: SimulationScenario[] = [
    'START_MACHINE',
    'NORMAL_PRODUCTION',
    'UNEXPECTED_STOP',
    'VIBRATION_ANOMALY',
    'OVERHEATING',
    'EMERGENCY_STOP',
    'SENSOR_DISCONNECT',
    'SENSOR_RECONNECT',
    'RESUME_PRODUCTION',
    'PLANNED_MAINTENANCE',
  ];

  if (!scenario || !validScenarios.includes(scenario)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SCENARIO', message: `Scenario must be one of: ${validScenarios.join(', ')}` },
    });
  }

  try {
    const updated = simulationEngine.triggerScenario(id, scenario, reason);
    return res.json({
      success: true,
      data: updated,
      message: `Scenario ${scenario} triggered successfully on ${updated.machine_code}.`,
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'SCENARIO_ERROR', message: err.message } });
  }
});

// GET /api/simulation/machines/:id/signals
simulationRouter.get('/machines/:id/signals', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const telemetry = simulationEngine.getMachineTelemetry(id);

  if (!telemetry) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Machine not found.' } });
  }

  return res.json({
    success: true,
    data: {
      machine_id: id,
      machine_code: telemetry.machine_code,
      signals: telemetry.recent_signals,
      source: 'SIMULATED',
      disclaimer: 'Simulated industrial sensor telemetry.',
    },
  });
});

// PATCH /api/simulation/machines/:id/config
simulationRouter.patch('/machines/:id/config', (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const updatedConfig = simulationEngine.updateConfig(id, req.body);
    return res.json({ success: true, data: updatedConfig, message: 'Simulation configuration saved.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: 'CONFIG_ERROR', message: err.message } });
  }
});

// GET /api/simulation/production-records
simulationRouter.get('/production-records', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: simulationEngine.getSimulatedRecords(),
  });
});
