/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.utils.junit.BaseTest;
import org.junit.jupiter.api.Test;

class MigrationResultTest extends BaseTest {

  @Test
  void shouldInitializeWithDefaultValues() {
    MigrationResult result = new MigrationResult();

    assertEquals(0, result.getTotalInstancesToMigrate());
    assertEquals(0, result.getSuccessfulMigrations());
    assertEquals(0, result.getFailedMigrations());
    assertFalse(result.isMigrationError());
    assertEquals(0, result.getTasksCancelled());
    assertEquals(0, result.getTasksCreated());
  }

  @Test
  void shouldIncrementSuccessfulMigrations() {
    MigrationResult result = new MigrationResult();

    result.incrementSuccessfulMigrations();
    result.incrementSuccessfulMigrations();

    assertEquals(2, result.getSuccessfulMigrations());
  }

  @Test
  void shouldIncrementFailedMigrations() {
    MigrationResult result = new MigrationResult();

    result.incrementFailedMigrations();
    result.incrementFailedMigrations();

    assertEquals(2, result.getFailedMigrations());
  }

  @Test
  void shouldMarkMigrationError() {
    MigrationResult result = new MigrationResult();
    assertFalse(result.isMigrationError());

    result.markMigrationError();

    assertTrue(result.isMigrationError());
  }

  @Test
  void shouldIncrementTaskCounters() {
    MigrationResult result = new MigrationResult();

    result.incrementTasksCancelled();
    result.incrementTasksCancelled();
    result.incrementTasksCreated();

    assertEquals(2, result.getTasksCancelled());
    assertEquals(1, result.getTasksCreated());
  }
}
