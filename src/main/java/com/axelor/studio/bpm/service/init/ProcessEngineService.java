package com.axelor.studio.bpm.service.init;

import org.camunda.bpm.engine.ProcessEngine;

public interface ProcessEngineService {

  /**
   * Initializes the process engine for the current tenant. Should be called when the BPM app is
   * installed or at startup if BPM is already active.
   */
  void initialize();

  /**
   * Checks if the process engine is initialized for the current tenant.
   *
   * @return true if the engine is initialized
   */
  boolean isInitialized();

  /**
   * Shuts down all process engines gracefully. Should be called during application shutdown or when
   * BPM app is uninstalled.
   */
  void shutdown();

  void addEngine(String tenantId);

  ProcessEngine getEngine();

  void removeEngine(String tenantId);

  String getWkfViewerUrl();
}
