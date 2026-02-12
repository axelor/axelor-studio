/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import com.axelor.studio.db.WkfModel;

/** Service for synchronizing Axelor users to Camunda Identity Service. */
public interface WkfIdentityService {

  /**
   * Synchronizes users from a WkfModel to Camunda.
   *
   * @param model the workflow model
   * @return synchronization report
   * @throws IllegalStateException if a critical error occurs
   */
  WkfIdentitySyncReport syncModelIdentities(WkfModel model);

  /**
   * Manually re-synchronizes identities for a deployed workflow model.
   *
   * @param modelId the ID of the workflow model
   * @return synchronization report with validation results
   * @throws IllegalArgumentException if model is not found or validation fails
   */
  WkfIdentitySyncReport resyncModelIdentities(Long modelId);
}
