/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.cockpit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import com.axelor.db.JPA;
import com.axelor.studio.db.repo.WkfModelRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

class CockpitCamundaQueryServiceTest {

  private CockpitCamundaQueryServiceImpl service;
  private WkfModelRepository wkfModelRepository;
  private MockedStatic<JPA> jpaMock;
  private EntityManager entityManager;
  private Query nativeQuery;

  @BeforeEach
  void setUp() {
    wkfModelRepository = mock(WkfModelRepository.class);
    service = new CockpitCamundaQueryServiceImpl(wkfModelRepository);

    entityManager = mock(EntityManager.class);
    nativeQuery = mock(Query.class);

    jpaMock = mockStatic(JPA.class);
    jpaMock.when(JPA::em).thenReturn(entityManager);
    when(entityManager.createNativeQuery(anyString())).thenReturn(nativeQuery);
    when(nativeQuery.setParameter(anyString(), org.mockito.ArgumentMatchers.any()))
        .thenReturn(nativeQuery);
  }

  @AfterEach
  void tearDown() {
    jpaMock.close();
  }

  @Test
  void countRunningInstances_returnsCorrectCount() {
    when(nativeQuery.getSingleResult()).thenReturn(42L);

    long count = service.countRunningInstances("myProcess");

    assertEquals(42L, count);
  }

  @Test
  void countRunningInstances_handlesIntegerResult() {
    // Some JDBC drivers return Integer instead of Long
    when(nativeQuery.getSingleResult()).thenReturn(7);

    long count = service.countRunningInstances("myProcess");

    assertEquals(7L, count);
  }

  @Test
  void countOpenIncidents_returnsCorrectCount() {
    when(nativeQuery.getSingleResult()).thenReturn(3L);

    long count = service.countOpenIncidents("myProcess");

    assertEquals(3L, count);
  }

  @Test
  void averageCycleTimeMinutes_returnsNullWhenNoData() {
    when(nativeQuery.getSingleResult()).thenReturn(null);

    Double result = service.averageCycleTimeMinutes("myProcess");

    assertNull(result);
  }

  @Test
  void averageCycleTimeMinutes_returnsValueWhenDataExists() {
    when(nativeQuery.getSingleResult()).thenReturn(45.5);

    Double result = service.averageCycleTimeMinutes("myProcess");

    assertEquals(45.5, result, 0.001);
  }

  @Test
  void slaCompliancePercent_returnsNullWhenNoCompleted() {
    // Total completed = 0
    when(nativeQuery.getSingleResult()).thenReturn(0L);

    Double result = service.slaCompliancePercent("myProcess", 60);

    assertNull(result);
  }

  @Test
  void slaCompliancePercent_calculatesCorrectPercentage() {
    // First call: total = 10, second call: within target = 8
    when(nativeQuery.getSingleResult()).thenReturn(10L).thenReturn(8L);

    Double result = service.slaCompliancePercent("myProcess", 60);

    assertEquals(80.0, result, 0.001);
  }

  @Test
  void periodToTimestamp_converts7d() {
    Timestamp result = service.periodToTimestamp("7d");

    LocalDateTime expected = LocalDateTime.now().minusDays(7);
    // Allow 1-second tolerance
    long diffSeconds =
        Math.abs(
            result.toLocalDateTime().toEpochSecond(java.time.ZoneOffset.UTC)
                - expected.toEpochSecond(java.time.ZoneOffset.UTC));
    assertEquals(0, diffSeconds, 2, "7d should map to ~7 days ago");
  }

  @Test
  void periodToTimestamp_converts30d() {
    Timestamp result = service.periodToTimestamp("30d");

    LocalDateTime expected = LocalDateTime.now().minusDays(30);
    long diffSeconds =
        Math.abs(
            result.toLocalDateTime().toEpochSecond(java.time.ZoneOffset.UTC)
                - expected.toEpochSecond(java.time.ZoneOffset.UTC));
    assertEquals(0, diffSeconds, 2, "30d should map to ~30 days ago");
  }

  @Test
  void periodToTimestamp_converts90d() {
    Timestamp result = service.periodToTimestamp("90d");

    LocalDateTime expected = LocalDateTime.now().minusDays(90);
    long diffSeconds =
        Math.abs(
            result.toLocalDateTime().toEpochSecond(java.time.ZoneOffset.UTC)
                - expected.toEpochSecond(java.time.ZoneOffset.UTC));
    assertEquals(0, diffSeconds, 2, "90d should map to ~90 days ago");
  }

  @Test
  void periodToTimestamp_converts6m() {
    Timestamp result = service.periodToTimestamp("6m");

    LocalDateTime expected = LocalDateTime.now().minusMonths(6);
    long diffSeconds =
        Math.abs(
            result.toLocalDateTime().toEpochSecond(java.time.ZoneOffset.UTC)
                - expected.toEpochSecond(java.time.ZoneOffset.UTC));
    assertEquals(0, diffSeconds, 2, "6m should map to ~6 months ago");
  }

  @Test
  void periodToTimestamp_throwsOnInvalidPeriod() {
    assertThrows(IllegalArgumentException.class, () -> service.periodToTimestamp(null));
    assertThrows(IllegalArgumentException.class, () -> service.periodToTimestamp(""));
    assertThrows(IllegalArgumentException.class, () -> service.periodToTimestamp("x"));
    assertThrows(IllegalArgumentException.class, () -> service.periodToTimestamp("7x"));
    assertThrows(IllegalArgumentException.class, () -> service.periodToTimestamp("abc"));
  }
}
