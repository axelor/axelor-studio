/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.db.JpaRepository;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;

class StudioAppDetachHelperTest extends BaseTest {

  protected final StudioAppDetachHelper helper;

  @Inject
  StudioAppDetachHelperTest(StudioAppDetachHelper helper) {
    this.helper = helper;
  }

  // --- detachEntities tests ---

  @Test
  void detachEntities_shouldThrowWhenZipKeysIsNull() {
    JpaRepository<MetaJsonField> repo = mockRepository(Collections.emptyList());

    assertThrows(
        NullPointerException.class,
        () ->
            helper.detachEntities(
                repo,
                "self.studioApp.id = :appId",
                1L,
                MetaJsonField::getName,
                field -> field.setStudioApp(null),
                null,
                MetaJsonField.class,
                new ArrayList<>()));
  }

  @Test
  void detachEntities_shouldReturnZeroWhenNoEntitiesExist() {
    JpaRepository<MetaJsonField> repo = mockRepository(Collections.emptyList());

    int detached =
        helper.detachEntities(
            repo,
            "self.studioApp.id = :appId",
            1L,
            MetaJsonField::getName,
            field -> field.setStudioApp(null),
            Set.of("key1"),
            MetaJsonField.class,
            new ArrayList<>());

    assertEquals(0, detached);
  }

  @Test
  void detachEntities_shouldNotDetachEntityPresentInZipKeys() {
    MetaJsonField field = mock(MetaJsonField.class);
    when(field.getName()).thenReturn("presentKey");
    JpaRepository<MetaJsonField> repo = mockRepository(List.of(field));

    List<String> detachLog = new ArrayList<>();
    int detached =
        helper.detachEntities(
            repo,
            "self.studioApp.id = :appId",
            1L,
            MetaJsonField::getName,
            f -> f.setStudioApp(null),
            Set.of("presentKey"),
            MetaJsonField.class,
            detachLog);

    assertEquals(0, detached);
    verify(repo, never()).save(any());
  }

  @Test
  void detachEntities_shouldDetachEntityAbsentFromZipKeys() {
    MetaJsonField field = mock(MetaJsonField.class);
    when(field.getName()).thenReturn("absentKey");
    JpaRepository<MetaJsonField> repo = mockRepository(List.of(field));

    List<String> detachLog = new ArrayList<>();
    int detached =
        helper.detachEntities(
            repo,
            "self.studioApp.id = :appId",
            1L,
            MetaJsonField::getName,
            f -> f.setStudioApp(null),
            Set.of("otherKey"),
            MetaJsonField.class,
            detachLog);

    assertEquals(1, detached);
    verify(field).setStudioApp(null);
    verify(repo).save(field);
    assertEquals(1, detachLog.size());
  }

  @Test
  void detachEntities_shouldSkipEntityWithNullKey() {
    MetaJsonField field = mock(MetaJsonField.class);
    when(field.getName()).thenReturn(null);
    JpaRepository<MetaJsonField> repo = mockRepository(List.of(field));

    List<String> detachLog = new ArrayList<>();
    int detached =
        helper.detachEntities(
            repo,
            "self.studioApp.id = :appId",
            1L,
            MetaJsonField::getName,
            f -> f.setStudioApp(null),
            Set.of("someKey"),
            MetaJsonField.class,
            detachLog);

    assertEquals(0, detached);
    verify(repo, never()).save(any());
  }

  @Test
  void detachEntities_shouldDetachOnlyAbsentEntities() {
    MetaJsonField present = mock(MetaJsonField.class);
    when(present.getName()).thenReturn("inZip");
    MetaJsonField absent = mock(MetaJsonField.class);
    when(absent.getName()).thenReturn("notInZip");
    JpaRepository<MetaJsonField> repo = mockRepository(List.of(present, absent));

    List<String> detachLog = new ArrayList<>();
    int detached =
        helper.detachEntities(
            repo,
            "self.studioApp.id = :appId",
            1L,
            MetaJsonField::getName,
            f -> f.setStudioApp(null),
            Set.of("inZip"),
            MetaJsonField.class,
            detachLog);

    assertEquals(1, detached);
    verify(present, never()).setStudioApp(null);
    verify(absent).setStudioApp(null);
    verify(repo).save(absent);
    verify(repo, never()).save(present);
  }

  @SuppressWarnings("unchecked")
  private JpaRepository<MetaJsonField> mockRepository(List<MetaJsonField> entities) {
    JpaRepository<MetaJsonField> repo = mock(JpaRepository.class, Answers.RETURNS_DEEP_STUBS);
    when(repo.all().filter(any(String.class)).bind(eq("appId"), any()).fetch())
        .thenReturn(entities);
    return repo;
  }
}
