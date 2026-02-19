/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import org.camunda.bpm.engine.ProcessEngine;

public interface ProcessEngineService {

  /**
   * Initializes the process engine for the given tenant. Should be called when the BPM app is
   * installed or at startup if BPM is already active.
   *
   * @param tenantId the tenant identifier
   */
  void initialize(String tenantId);

  /**
   * Checks if the process engine is initialized for the current tenant.
   *
   * @return true if the engine is initialized
   */
  boolean isInitialized();

  /**
   * Checks if the process engine is initialized for a specific tenant.
   *
   * @param tenantId the tenant identifier
   * @return true if the engine is initialized for the specified tenant
   */
  boolean isInitialized(String tenantId);

  /**
   * Checks if at least one tenant has an initialized process engine.
   *
   * @return true if any tenant has an initialized engine
   */
  boolean isAnyTenantInitialized();

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
