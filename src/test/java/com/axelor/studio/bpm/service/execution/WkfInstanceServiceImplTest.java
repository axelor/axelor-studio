/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.execution;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfInstanceVariable;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.junit.BaseTest;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.ProcessEngines;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.runtime.ProcessInstance;
import org.camunda.bpm.engine.runtime.ProcessInstanceQuery;
import org.camunda.bpm.engine.variable.VariableMap;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class WkfInstanceServiceImplTest extends BaseTest {

  protected final LoaderHelper loaderHelper;
  protected final UserRepository userRepository;
  protected final WkfInstanceService wkfInstanceService;

  @Inject
  public WkfInstanceServiceImplTest(
      LoaderHelper loaderHelper,
      UserRepository userRepository,
      WkfInstanceServiceImpl wkfInstanceService) {
    this.loaderHelper = loaderHelper;
    this.userRepository = userRepository;
    this.wkfInstanceService = wkfInstanceService;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/users-input.xml");
  }

  @Test
  void shouldReturnEntityReferenceVariablesWhenProcessExistsWithValidData() {
    // Arrange
    User user = userRepository.findByCode("customize");
    assertNotNull(user);

    FullContext fullContext = new FullContext(user);
    Object entityReference = WkfContextHelper.createObject(fullContext);

    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("test-process-123");

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      ProcessEngine mockProcessEngine = createMockProcessEngine();
      mockedStatic.when(ProcessEngines::getDefaultProcessEngine).thenReturn(mockProcessEngine);

      VariableMap variableMap = createVariableMapWithEntityReference(entityReference);
      setupMockProcessEngineWithVariables("test-process-123", variableMap);

      List<WkfInstanceVariable> result = wkfInstanceService.getWkfInstanceVariables(instance);

      assertEquals(2, result.size());

      WkfInstanceVariable singleUserVar =
          result.stream()
              .filter(var -> "singleUser".equals(var.getName()))
              .findFirst()
              .orElse(null);

      assertNotNull(singleUserVar);
      assertTrue(singleUserVar.getValue().contains("User:"));
      assertTrue(singleUserVar.getValue().contains("id: " + user.getId()));
    }
  }

  @Test
  void shouldReturnEntityListVariablesWhenProcessHasListReferences() {
    // Arrange
    User user = userRepository.findByCode("customize");
    assertNotNull(user);

    List<FullContext> userList = new ArrayList<>();
    userList.add(new FullContext(user));
    Object entityListReference = WkfContextHelper.createObject(userList);

    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("test-process-list");

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      ProcessEngine mockProcessEngine = createMockProcessEngine();
      mockedStatic.when(ProcessEngines::getDefaultProcessEngine).thenReturn(mockProcessEngine);

      VariableMap variableMap = createVariableMapWithEntityList(entityListReference);
      setupMockProcessEngineWithVariables("test-process-list", variableMap);

      List<WkfInstanceVariable> result = wkfInstanceService.getWkfInstanceVariables(instance);

      assertEquals(1, result.size());
      assertTrue(result.get(0).getValue().contains("Entities:"));
      assertTrue(result.get(0).getValue().contains("items"));
    }
  }

  @Test
  void shouldReturnRegularVariablesWhenProcessHasNonEntityData() {
    // Arrange
    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("test-process-regular");

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      ProcessEngine mockProcessEngine = createMockProcessEngine();
      mockedStatic.when(ProcessEngines::getDefaultProcessEngine).thenReturn(mockProcessEngine);

      VariableMap variableMap = Variables.createVariables();
      variableMap.put("regularVar", "regular value");
      variableMap.put("numberVar", 42);
      setupMockProcessEngineWithVariables("test-process-regular", variableMap);

      List<WkfInstanceVariable> result = wkfInstanceService.getWkfInstanceVariables(instance);

      assertEquals(2, result.size());

      WkfInstanceVariable regularVar =
          result.stream()
              .filter(var -> "regularVar".equals(var.getName()))
              .findFirst()
              .orElse(null);

      assertNotNull(regularVar);
      assertEquals("regular value", regularVar.getValue());
    }
  }

  @Test
  void shouldReturnEmptyListWhenProcessDoesNotExist() {
    // Arrange
    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("non-existent-process");

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      ProcessEngine mockProcessEngine = createMockProcessEngine();
      mockedStatic.when(ProcessEngines::getDefaultProcessEngine).thenReturn(mockProcessEngine);

      setupMockProcessEngineWithNullInstance("non-existent-process");

      List<WkfInstanceVariable> result = wkfInstanceService.getWkfInstanceVariables(instance);

      assertTrue(result.isEmpty());
    }
  }

  @Test
  void shouldHandleGracefullyWhenEntityReferenceIsCorrupted() {
    // Arrange
    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("test-process-corrupted");

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      ProcessEngine mockProcessEngine = createMockProcessEngine();
      mockedStatic.when(ProcessEngines::getDefaultProcessEngine).thenReturn(mockProcessEngine);

      VariableMap variableMap = Variables.createVariables();
      Map<String, Object> corruptedEntityRef =
          Map.of(
              "type", "ENTITY_REFERENCE", "id", 999999L // Missing className
              );
      variableMap.put("corruptedEntity", corruptedEntityRef);
      variableMap.put("normalVar", "normal value");
      setupMockProcessEngineWithVariables("test-process-corrupted", variableMap);

      List<WkfInstanceVariable> result = wkfInstanceService.getWkfInstanceVariables(instance);

      assertEquals(2, result.size());

      WkfInstanceVariable corruptedVar =
          result.stream()
              .filter(var -> "corruptedEntity".equals(var.getName()))
              .findFirst()
              .orElse(null);

      assertNotNull(corruptedVar);
      assertTrue(
          corruptedVar.getValue().contains("Entity display error")
              || corruptedVar.getValue().contains("{"));
    }
  }

  @Test
  void shouldReturnEmptyListWhenProcessHasNoVariables() {
    // Arrange
    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("test-process-empty");

    // Act & Assert
    try (var mockedStatic = mockStatic(ProcessEngines.class)) {
      ProcessEngine mockProcessEngine = createMockProcessEngine();
      mockedStatic.when(ProcessEngines::getDefaultProcessEngine).thenReturn(mockProcessEngine);

      VariableMap emptyVariableMap = Variables.createVariables();
      setupMockProcessEngineWithVariables("test-process-empty", emptyVariableMap);

      List<WkfInstanceVariable> result = wkfInstanceService.getWkfInstanceVariables(instance);

      assertTrue(result.isEmpty());
    }
  }

  // Helper methods for setup
  private ProcessEngine mockProcessEngine;
  private RuntimeService mockRuntimeService;

  private ProcessEngine createMockProcessEngine() {
    mockProcessEngine = mock(ProcessEngine.class);
    mockRuntimeService = mock(RuntimeService.class);
    when(mockProcessEngine.getRuntimeService()).thenReturn(mockRuntimeService);
    return mockProcessEngine;
  }

  private void setupMockProcessEngineWithVariables(String instanceId, VariableMap variableMap) {
    ProcessInstance mockProcessInstance = mock(ProcessInstance.class);
    var mockQuery = mock(ProcessInstanceQuery.class);

    when(mockRuntimeService.createProcessInstanceQuery()).thenReturn(mockQuery);
    when(mockQuery.processInstanceId(instanceId)).thenReturn(mockQuery);
    when(mockQuery.singleResult()).thenReturn(mockProcessInstance);
    when(mockRuntimeService.getVariablesLocalTyped(instanceId)).thenReturn(variableMap);
  }

  private void setupMockProcessEngineWithNullInstance(String instanceId) {
    var mockQuery = mock(ProcessInstanceQuery.class);

    when(mockRuntimeService.createProcessInstanceQuery()).thenReturn(mockQuery);
    when(mockQuery.processInstanceId(instanceId)).thenReturn(mockQuery);
    when(mockQuery.singleResult()).thenReturn(null);
  }

  private VariableMap createVariableMapWithEntityReference(Object entityReference) {
    VariableMap variableMap = Variables.createVariables();

    ObjectValue objectValue = (ObjectValue) entityReference;
    Map<String, Object> entityRefData = (Map<String, Object>) objectValue.getValue();

    variableMap.put("singleUser", entityRefData);
    variableMap.put("regularVar", "regular value");

    return variableMap;
  }

  private VariableMap createVariableMapWithEntityList(Object entityListReference) {
    VariableMap variableMap = Variables.createVariables();

    ObjectValue objectValue = (ObjectValue) entityListReference;
    Map<String, Object> entityRefData = (Map<String, Object>) objectValue.getValue();

    variableMap.put("userList", entityRefData);

    return variableMap;
  }
}
