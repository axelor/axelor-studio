/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import com.axelor.studio.db.WkfProcess;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.camunda.bpm.engine.repository.ProcessDefinition;

/**
 * Immutable result of a BPM deployment operation. Carries all metadata needed by callers to
 * optionally trigger migration after deployment.
 */
@Getter
@AllArgsConstructor
public class DeploymentResult {

  /** Camunda deployment ID from deployment.getId(). */
  private final String deploymentId;

  /** Process definition key to processDefinitionId mapping. */
  private final Map<String, String> processMap;

  /** ProcessDefinitionId to WkfProcess mapping, needed for migration. */
  private final Map<String, WkfProcess> migrationProcessMap;

  /** Deployment ID of the previous version, null for first deploy. */
  private final String oldDeploymentId;

  /** All process definitions deployed in this operation. */
  private final List<ProcessDefinition> definitions;
}
