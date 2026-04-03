/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.utils.junit.BaseTest;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DeploymentResultTest extends BaseTest {

  @Test
  void shouldSetAllFieldsViaConstructor() {
    DeploymentResult result =
        new DeploymentResult(
            "deploy-1",
            Map.of("key1", "def1"),
            Collections.emptyMap(),
            "old-deploy-1",
            Collections.emptyList());

    assertEquals("deploy-1", result.getDeploymentId());
    assertEquals(Map.of("key1", "def1"), result.getProcessMap());
    assertNotNull(result.getMigrationProcessMap());
    assertEquals("old-deploy-1", result.getOldDeploymentId());
    assertNotNull(result.getDefinitions());
  }

  @Test
  void shouldAllowNullOldDeploymentIdForFirstDeploy() {
    DeploymentResult result =
        new DeploymentResult(
            "deploy-1",
            Collections.emptyMap(),
            Collections.emptyMap(),
            null,
            Collections.emptyList());

    assertNull(result.getOldDeploymentId());
  }

  @Test
  void shouldReturnAllGetterValues() {
    Map<String, String> processMap = Map.of("proc1", "def1", "proc2", "def2");

    DeploymentResult result =
        new DeploymentResult(
            "deploy-42", processMap, Collections.emptyMap(), "old-deploy-41", List.of());

    assertEquals("deploy-42", result.getDeploymentId());
    assertEquals(2, result.getProcessMap().size());
    assertTrue(result.getProcessMap().containsKey("proc1"));
    assertEquals("old-deploy-41", result.getOldDeploymentId());
    assertTrue(result.getDefinitions().isEmpty());
  }
}
