/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.context;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.junit.BaseTest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class WkfContextHelperTest extends BaseTest {

  protected final LoaderHelper loaderHelper;
  protected final UserRepository userRepository;

  @Inject
  public WkfContextHelperTest(LoaderHelper loaderHelper, UserRepository userRepository) {
    this.loaderHelper = loaderHelper;
    this.userRepository = userRepository;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/users-input.xml");
  }

  @Test
  void testCreateObjectWithFullContext() {
    // Arrange
    User user = userRepository.findByCode("customize");
    assertNotNull(user, "Test user should exist");
    FullContext fullContext = new FullContext(user);

    // Act
    Object result = WkfContextHelper.createObject(fullContext);

    // Assert
    assertNotNull(result, "Result should not be null");
    assertInstanceOf(ObjectValue.class, result);
  }

  @Test
  void testCreateObjectWithCollection() {
    // Arrange
    List<User> users = userRepository.all().fetch();
    assertFalse(users.isEmpty(), "Should have test users");

    List<FullContext> fullContexts = new ArrayList<>();
    for (User user : users) {
      fullContexts.add(new FullContext(user));
    }

    // Act
    Object result = WkfContextHelper.createObject(fullContexts);

    // Assert
    assertNotNull(result, "Result should not be null");
    assertInstanceOf(ObjectValue.class, result);
  }

  @Test
  void testCreateObjectWithNull() {
    assertThrows(IllegalArgumentException.class, () -> WkfContextHelper.createObject(null));
  }

  @Test
  void testCreateObjectWithUnsupportedType() {
    // Arrange
    String unsupportedObject = "This is not a supported type";

    // Act & Assert
    assertThrows(
        IllegalArgumentException.class, () -> WkfContextHelper.createObject(unsupportedObject));
  }

  @Test
  void testGetObjectWithEntityReference() throws JsonProcessingException {
    // Arrange
    User user = userRepository.findByCode("customize");
    assertNotNull(user, "Test user should exist");
    FullContext originalContext = new FullContext(user);

    Object createdVariable = WkfContextHelper.createObject(originalContext);

    DelegateExecution mockExecution = mock(DelegateExecution.class);
    String processInstanceId = "test-process-123";
    when(mockExecution.getProcessInstanceId()).thenReturn(processInstanceId);

    try (var mockedStatic = mockStatic(WkfContextHelper.class, CALLS_REAL_METHODS)) {
      ObjectValue objectValue = (ObjectValue) createdVariable;
      Map<String, Object> entityReferenceData = (Map<String, Object>) objectValue.getValue();

      mockedStatic
          .when(() -> WkfContextHelper.getVariable(processInstanceId, "testVar"))
          .thenReturn(entityReferenceData);

      // Act
      Object result = WkfContextHelper.getObject("testVar", mockExecution);

      // Assert
      assertNotNull(result, "Result should not be null");
      assertInstanceOf(FullContext.class, result, "Result should be a FullContext");
      FullContext resultContext = (FullContext) result;
      assertEquals(user.getId(), resultContext.get("id"), "Should retrieve the same user ID");
    }
  }

  @Test
  void testGetObjectWithEntityListReference() throws JsonProcessingException {
    // Arrange
    List<User> users = userRepository.all().fetch();
    assertFalse(users.isEmpty(), "Should have test users");

    List<FullContext> fullContexts = new ArrayList<>();
    for (User user : users) {
      fullContexts.add(new FullContext(user));
    }

    Object createdVariable = WkfContextHelper.createObject(fullContexts);

    DelegateExecution mockExecution = mock(DelegateExecution.class);
    String processInstanceId = "test-process-456";
    when(mockExecution.getProcessInstanceId()).thenReturn(processInstanceId);

    try (var mockedStatic = mockStatic(WkfContextHelper.class, CALLS_REAL_METHODS)) {
      ObjectValue objectValue = (ObjectValue) createdVariable;
      Map<String, Object> entityListReferenceData = (Map<String, Object>) objectValue.getValue();

      mockedStatic
          .when(() -> WkfContextHelper.getVariable(processInstanceId, "testListVar"))
          .thenReturn(entityListReferenceData);

      // Act
      Object result = WkfContextHelper.getObject("testListVar", mockExecution);

      // Assert
      assertNotNull(result, "Result should not be null");
      assertInstanceOf(List.class, result, "Result should be a List");
      List<?> resultList = (List<?>) result;
      assertFalse(resultList.isEmpty(), "Result list should not be empty");
      assertInstanceOf(
          FullContext.class, resultList.get(0), "List items should be FullContext instances");
    }
  }

  @Test
  void testGetObjectWithNonExistentEntity() throws JsonProcessingException {
    // Arrange
    DelegateExecution mockExecution = mock(DelegateExecution.class);
    String processInstanceId = "test-process-789";
    when(mockExecution.getProcessInstanceId()).thenReturn(processInstanceId);

    Map<String, Object> nonExistentEntityRef =
        Map.of(
            "id",
            999999L,
            "className",
            User.class.getName(),
            "version",
            0,
            "type",
            "ENTITY_REFERENCE");

    try (var mockedStatic = mockStatic(WkfContextHelper.class, CALLS_REAL_METHODS)) {
      mockedStatic
          .when(() -> WkfContextHelper.getVariable(processInstanceId, "nonExistentVar"))
          .thenReturn(nonExistentEntityRef);

      // Act
      Object result = WkfContextHelper.getObject("nonExistentVar", mockExecution);

      // Assert
      assertNull(result, "Result should be null for non-existent entity");
    }
  }

  @Test
  void testGetObjectFallsBackToLegacy() throws JsonProcessingException {
    // Arrange
    DelegateExecution mockExecution = mock(DelegateExecution.class);
    String processInstanceId = "test-process-legacy";
    when(mockExecution.getProcessInstanceId()).thenReturn(processInstanceId);

    Map<String, Object> legacyVariable = Map.of("someKey", "someValue");

    try (var mockedStatic = mockStatic(WkfContextHelper.class, CALLS_REAL_METHODS)) {
      mockedStatic
          .when(() -> WkfContextHelper.getVariable(processInstanceId, "legacyVar"))
          .thenReturn(legacyVariable);

      mockedStatic
          .when(
              () ->
                  WkfContextHelper.migrateDeprecatedVariable(
                      "legacyVar", legacyVariable, mockExecution))
          .thenReturn("legacy-result");

      // Act
      Object result = WkfContextHelper.getObject("legacyVar", mockExecution);

      // Assert
      assertEquals("legacy-result", result, "Should fall back to legacy method");
    }
  }

  @Test
  void testCreateObjectWithEmptyCollection() {
    // Arrange
    Collection<FullContext> emptyCollection = new ArrayList<>();

    // Act
    Object result = WkfContextHelper.createObject(emptyCollection);

    // Assert
    assertNotNull(result, "Result should not be null even for empty collection");
    assertInstanceOf(ObjectValue.class, result);
  }

  @Test
  void testGetObjectWithNonExistingVariableShouldReturnNull() throws JsonProcessingException {
    // Arrange
    DelegateExecution mockExecution = mock(DelegateExecution.class);
    String processInstanceId = "test-process-legacy";
    when(mockExecution.getProcessInstanceId()).thenReturn(processInstanceId);

    try (var mockedStatic = mockStatic(WkfContextHelper.class, CALLS_REAL_METHODS)) {
      mockedStatic
          .when(() -> WkfContextHelper.getVariable(processInstanceId, "nonExistingVar"))
          .thenReturn(null);

      // Act
      Object result = WkfContextHelper.getObject("nonExistingVar", mockExecution);

      // Assert
      assertNull(result, "Should return null for non-existing variable");
    }
  }
}
