/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.utils.junit.BaseTest;
import org.junit.jupiter.api.Test;

class WkfIdentitySyncReportTest extends BaseTest {

  @Test
  void shouldInitializeWithStartTime() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();

    assertNotNull(report.getStartTime());
    assertTrue(report.isSuccess());
  }

  @Test
  void shouldBeSuccessWhenNoErrors() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();
    report.incrementUsersCreated();
    report.incrementMembershipsCreated();

    report.complete();

    assertTrue(report.isSuccess());
    assertEquals(0, report.getUsersErrors());
    assertEquals(0, report.getMembershipsErrors());
    assertTrue(report.getErrors().isEmpty());
  }

  @Test
  void shouldBeErrorWhenUserErrors() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();
    report.incrementUsersErrors();

    report.complete();

    assertFalse(report.isSuccess());
  }

  @Test
  void shouldBeErrorWhenMembershipErrors() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();
    report.incrementMembershipsErrors();

    report.complete();

    assertFalse(report.isSuccess());
  }

  @Test
  void shouldBeErrorWhenExplicitErrorAdded() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();

    report.addError("Something went wrong");

    assertFalse(report.isSuccess());
    assertEquals(1, report.getErrors().size());
    assertEquals("Something went wrong", report.getErrors().get(0));
  }

  @Test
  void shouldCalculateDuration() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();

    report.complete();

    assertNotNull(report.getEndTime());
    assertNotNull(report.getDuration());
    assertTrue(report.getDuration().toMillis() >= 0);
  }

  @Test
  void shouldIncrementCountersCorrectly() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();

    report.incrementUsersCreated();
    report.incrementUsersCreated();
    report.incrementUsersUpdated();
    report.incrementUsersErrors();
    report.incrementMembershipsCreated();
    report.incrementMembershipsCreated();
    report.incrementMembershipsCreated();
    report.incrementMembershipsDeleted();
    report.incrementMembershipsErrors();

    assertEquals(2, report.getUsersCreated());
    assertEquals(1, report.getUsersUpdated());
    assertEquals(1, report.getUsersErrors());
    assertEquals(3, report.getMembershipsCreated());
    assertEquals(1, report.getMembershipsDeleted());
    assertEquals(1, report.getMembershipsErrors());
  }

  @Test
  void shouldReturnFormattedToString() {
    WkfIdentitySyncReport report = new WkfIdentitySyncReport();
    report.incrementUsersCreated();
    report.complete();

    String toString = report.toString();

    assertTrue(toString.contains("Sync Report"));
    assertTrue(toString.contains("Users: 1 created"));
    assertTrue(toString.contains("SUCCESS"));
  }
}
