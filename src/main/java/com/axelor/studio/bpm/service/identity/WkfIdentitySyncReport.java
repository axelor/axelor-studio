/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * Report of a Camunda identity synchronization operation. Contains statistics and errors for users
 * and group memberships.
 */
@Setter
@Getter
public class WkfIdentitySyncReport {

  private LocalDateTime startTime;
  private LocalDateTime endTime;

  private int usersCreated = 0;
  private int usersUpdated = 0;
  private int usersErrors = 0;

  private int membershipsCreated = 0;
  private int membershipsDeleted = 0;
  private int membershipsErrors = 0;

  private List<String> errors = new ArrayList<>();

  private boolean success = true;

  public WkfIdentitySyncReport() {
    this.startTime = LocalDateTime.now();
  }

  public void complete() {
    this.endTime = LocalDateTime.now();
    this.success = (usersErrors == 0 && membershipsErrors == 0 && errors.isEmpty());
  }

  public Duration getDuration() {
    if (endTime == null) {
      return Duration.between(startTime, LocalDateTime.now());
    }
    return Duration.between(startTime, endTime);
  }

  public void addError(String error) {
    this.errors.add(error);
    this.success = false;
  }

  // Utility increment methods
  public void incrementUsersCreated() {
    this.usersCreated++;
  }

  public void incrementUsersUpdated() {
    this.usersUpdated++;
  }

  public void incrementUsersErrors() {
    this.usersErrors++;
  }

  public void incrementMembershipsCreated() {
    this.membershipsCreated++;
  }

  public void incrementMembershipsDeleted() {
    this.membershipsDeleted++;
  }

  public void incrementMembershipsErrors() {
    this.membershipsErrors++;
  }

  @Override
  public String toString() {
    return String.format(
        "Sync Report [Duration: %ss | Users: %d created, %d updated, %d errors | "
            + "Memberships: %d created, %d deleted, %d errors | Status: %s]",
        getDuration().toMillis() / 1000.0,
        usersCreated,
        usersUpdated,
        usersErrors,
        membershipsCreated,
        membershipsDeleted,
        membershipsErrors,
        success ? "SUCCESS" : "ERROR");
  }
}
