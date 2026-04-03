/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Mutable accumulator for migration operation results. Follows the WkfIdentitySyncReport pattern
 * with increment helpers for thread-safe-ish accumulation during migration processing.
 */
@Getter
@Setter
public class MigrationResult {

  private int totalInstancesToMigrate = 0;
  private int successfulMigrations = 0;
  private int failedMigrations = 0;
  private boolean migrationError = false;
  private int tasksCancelled = 0;
  private int tasksCreated = 0;

  public void incrementSuccessfulMigrations() {
    this.successfulMigrations++;
  }

  public void incrementFailedMigrations() {
    this.failedMigrations++;
  }

  public void incrementTasksCancelled() {
    this.tasksCancelled++;
  }

  public void incrementTasksCreated() {
    this.tasksCreated++;
  }

  public void markMigrationError() {
    this.migrationError = true;
  }
}
