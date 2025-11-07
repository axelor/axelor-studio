/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.execution;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonRecordRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.tuple.Pair;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.task.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

public class WkfUserActionServiceTest extends BaseTest {

  protected final WkfUserActionServiceImpl wkfUserActionService;
  protected final TeamTaskRepository teamTaskRepository;
  protected final MetaModelRepository metaModelRepository;
  protected final MetaJsonRecordRepository metaJsonRecordRepository;
  protected final LoaderHelper loaderHelper;

  @Inject
  public WkfUserActionServiceTest(
      WkfUserActionServiceImpl wkfUserActionService,
      TeamTaskRepository teamTaskRepository,
      MetaModelRepository metaModelRepository,
      MetaJsonRecordRepository metaJsonRecordRepository,
      LoaderHelper loaderHelper) {
    this.wkfUserActionService = wkfUserActionService;
    this.teamTaskRepository = teamTaskRepository;
    this.metaModelRepository = metaModelRepository;
    this.metaJsonRecordRepository = metaJsonRecordRepository;
    this.loaderHelper = loaderHelper;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/meta-model-input.xml");
    loaderHelper.importCsv("data/team-task-input.xml");
    loaderHelper.importCsv("data/meta-json-record-input.xml");
  }

  @Test
  void shouldNotCreateUserActionWhenTitleIsNull() throws ClassNotFoundException {
    // Arrange
    WkfTaskConfig wkfTaskConfig = new WkfTaskConfig();
    wkfTaskConfig.setTaskEmailTitle(null);

    DelegateExecution execution = mock(DelegateExecution.class);

    WkfUserActionServiceImpl spyService = Mockito.spy(wkfUserActionService);

    // Act
    spyService.createUserAction(wkfTaskConfig, execution);

    // Assert
    verify(spyService, never()).getModelCtx(any(), any());
    verify(spyService, never()).buildTeamTask(any(), any(), any(), any(), any(), any());
  }

  @Test
  @Transactional
  void shouldCreateUserActionSuccessfully() throws Exception {
    // Arrange
    WkfTaskConfig wkfTaskConfig = mock(WkfTaskConfig.class);
    when(wkfTaskConfig.getTaskEmailTitle()).thenReturn("My task title");
    when(wkfTaskConfig.getModelName()).thenReturn("com.axelor.app.SomeModel");

    DelegateExecution execution = mock(DelegateExecution.class);
    when(execution.getProcessInstanceId()).thenReturn("proc123");
    when(execution.getProcessDefinitionId()).thenReturn("def456");
    when(execution.getCurrentActivityName()).thenReturn("Approve Request");

    ProcessEngine mockEngine = mock(ProcessEngine.class);
    RuntimeService mockRuntime = mock(RuntimeService.class);
    WkfCommonService wkfCommonService = mock(WkfCommonService.class);
    when(execution.getProcessEngine()).thenReturn(mockEngine);
    when(mockEngine.getRuntimeService()).thenReturn(mockRuntime);

    Map<String, Object> processVars = new HashMap<>();
    processVars.put("var1", "value1");
    when(mockRuntime.getVariables("proc123")).thenReturn(processVars);

    when(wkfCommonService.getVarName(anyString())).thenReturn("someVar");

    FullContext mockCtx = mock(FullContext.class);
    WkfUserActionServiceImpl spyService = Mockito.spy(wkfUserActionService);

    doReturn(mockCtx).when(spyService).getModelCtx(wkfTaskConfig, execution);

    TeamTask mockTask = new TeamTask();
    mockTask.setName("task");
    doReturn(mockTask)
        .when(spyService)
        .buildTeamTask(
            eq(mockCtx),
            eq(wkfTaskConfig),
            anyMap(),
            eq("proc123"),
            eq("def456"),
            eq("Approve Request"));

    try (MockedStatic<ExceptionHelper> mocked = mockStatic(ExceptionHelper.class)) {

      // Act
      spyService.createUserAction(wkfTaskConfig, execution);

      // Assert
      assertNotNull(mockTask);
      verify(spyService, times(1)).getModelCtx(wkfTaskConfig, execution);
      verify(spyService, times(1))
          .buildTeamTask(
              any(FullContext.class),
              eq(wkfTaskConfig),
              anyMap(),
              eq("proc123"),
              eq("def456"),
              eq("Approve Request"));
    }
  }

  @Test
  void shouldReturnWhenTaskConfigIsNull() throws Exception {
    // Arrange
    Task task = mock(Task.class);
    ProcessEngine processEngine = mock(ProcessEngine.class);

    WkfUserActionServiceImpl spyService = Mockito.spy(wkfUserActionService);

    // Act & Assert
    assertDoesNotThrow(
        () -> spyService.createTeamTaskFromMigration(task, null, "proc123", processEngine));

    verify(spyService, never()).buildMigrationContextVariables(any(), anyString(), any());
    verify(spyService, never()).extractWkfContextFromVariables(any(), anyMap());
    verify(spyService, never()).buildTeamTask(any(), any(), any(), any(), any(), any());
  }

  @Test
  void shouldMigrateTeamTaskSuccessfully() throws Exception {
    // Arrange
    WkfTaskConfig wkfTaskConfig = mock(WkfTaskConfig.class);
    when(wkfTaskConfig.getName()).thenReturn("My Migration Task");
    when(wkfTaskConfig.getId()).thenReturn(42L);

    Task mockTask = mock(Task.class);
    when(mockTask.getProcessDefinitionId()).thenReturn("def123");
    when(mockTask.getName()).thenReturn("Review Order");

    ProcessEngine processEngine = mock(ProcessEngine.class);

    WkfUserActionServiceImpl spyService = Mockito.spy(wkfUserActionService);

    Map<String, Object> contextVars = new HashMap<>();
    contextVars.put("key1", "value1");

    doReturn(contextVars)
        .when(spyService)
        .buildMigrationContextVariables(wkfTaskConfig, "proc123", processEngine);

    FullContext mockContext = mock(FullContext.class);
    doReturn(mockContext)
        .when(spyService)
        .extractWkfContextFromVariables(wkfTaskConfig, contextVars);

    TeamTask newTask = new TeamTask();
    newTask.setName("task");

    doReturn(newTask)
        .when(spyService)
        .buildTeamTask(
            mockContext, wkfTaskConfig, contextVars, "proc123", "def123", "Review Order");

    try (MockedStatic<ExceptionHelper> mocked = mockStatic(ExceptionHelper.class)) {

      // Act
      spyService.createTeamTaskFromMigration(mockTask, wkfTaskConfig, "proc123", processEngine);

      // Assert
      assertNotNull(newTask);
      verify(spyService, times(1))
          .buildMigrationContextVariables(wkfTaskConfig, "proc123", processEngine);
      verify(spyService, times(1))
          .buildTeamTask(
              mockContext, wkfTaskConfig, contextVars, "proc123", "def123", "Review Order");
    }
  }

  @Test
  void shouldHandleNullTeamTaskGracefully() throws Exception {
    // Arrange
    WkfTaskConfig wkfTaskConfig = mock(WkfTaskConfig.class);
    when(wkfTaskConfig.getName()).thenReturn("NullTask");
    when(wkfTaskConfig.getId()).thenReturn(99L);

    Task mockTask = mock(Task.class);
    when(mockTask.getProcessDefinitionId()).thenReturn("defNull");
    when(mockTask.getName()).thenReturn("Null Builder");

    ProcessEngine processEngine = mock(ProcessEngine.class);

    WkfUserActionServiceImpl spyService = Mockito.spy(wkfUserActionService);

    Map<String, Object> ctxVars = Map.of("k", "v");

    doReturn(ctxVars)
        .when(spyService)
        .buildMigrationContextVariables(wkfTaskConfig, "procNull", processEngine);
    doReturn(mock(FullContext.class))
        .when(spyService)
        .extractWkfContextFromVariables(wkfTaskConfig, ctxVars);

    doReturn(null)
        .when(spyService)
        .buildTeamTask(
            any(),
            eq(wkfTaskConfig),
            eq(ctxVars),
            eq("procNull"),
            eq("defNull"),
            eq("Null Builder"));

    try (MockedStatic<ExceptionHelper> mocked = mockStatic(ExceptionHelper.class)) {

      // Act
      spyService.createTeamTaskFromMigration(mockTask, wkfTaskConfig, "procNull", processEngine);

      // Assert
      verify(spyService, times(1))
          .buildTeamTask(
              any(),
              eq(wkfTaskConfig),
              eq(ctxVars),
              eq("procNull"),
              eq("defNull"),
              eq("Null Builder"));
    }
  }

  @Test
  void shouldHandleEmptyListInUpdateTasksBatchStatus() {
    // Arrange
    List<Pair<String, String>> emptyList = new ArrayList<>();

    // Act & Assert - should not throw exception
    assertDoesNotThrow(() -> wkfUserActionService.updateTasksBatchStatus(emptyList, "canceled"));
  }

  @Test
  void shouldHandleNullListInUpdateTasksBatchStatus() {
    // Act & Assert - should not throw exception
    assertDoesNotThrow(() -> wkfUserActionService.updateTasksBatchStatus(null, "canceled"));
  }

    @Test
    void shouldReturnNullWhenNoModelNameProvided() throws ClassNotFoundException {
        // Arrange
        WkfTaskConfig wkfTaskConfig = new WkfTaskConfig();
        wkfTaskConfig.setModelName(null);
        wkfTaskConfig.setJsonModelName(null);

        DelegateExecution execution = mock(DelegateExecution.class);

        // Act
        FullContext result = wkfUserActionService.getModelCtx(wkfTaskConfig, execution);

        // Assert
        assertNull(result);
    }

    @Test
    void testGetModelCtxIsCalledWithCorrectParameters() throws Exception {
        // Arrange
        WkfTaskConfig wkfTaskConfig = mock(WkfTaskConfig.class);
        when(wkfTaskConfig.getTaskEmailTitle()).thenReturn("Test Task");
        when(wkfTaskConfig.getModelName()).thenReturn("SomeModel");

        DelegateExecution execution = mock(DelegateExecution.class);
        when(execution.getProcessInstanceId()).thenReturn("proc123");
        when(execution.getProcessDefinitionId()).thenReturn("def456");
        when(execution.getCurrentActivityName()).thenReturn("TestActivity");

        ProcessEngine mockEngine = mock(ProcessEngine.class);
        RuntimeService mockRuntime = mock(RuntimeService.class);
        when(execution.getProcessEngine()).thenReturn(mockEngine);
        when(mockEngine.getRuntimeService()).thenReturn(mockRuntime);

        Map<String, Object> processVars = new HashMap<>();
        when(mockRuntime.getVariables("proc123")).thenReturn(processVars);

        WkfUserActionServiceImpl spyService = Mockito.spy(wkfUserActionService);

        FullContext mockContext = mock(FullContext.class);
        doReturn(mockContext).when(spyService).getModelCtx(wkfTaskConfig, execution);
        doReturn(null).when(spyService).buildTeamTask(any(), any(), any(), any(), any(), any());

        try (MockedStatic<ExceptionHelper> mocked = mockStatic(ExceptionHelper.class)) {
            // Act
            spyService.createUserAction(wkfTaskConfig, execution);

            // Assert
            verify(spyService, times(1)).getModelCtx(wkfTaskConfig, execution);
        }
    }

    @Test
    void testGetModelCtxShouldFetchRecordByModelName() throws Exception {
        // Arrange
        WkfTaskConfig wkfTaskConfig = mock(WkfTaskConfig.class);
        when(wkfTaskConfig.getModelName()).thenReturn("TeamTask");
        when(wkfTaskConfig.getJsonModelName()).thenReturn(null);

        TeamTask teamTask = teamTaskRepository.all().fetchOne();
        DelegateExecution execution = mock(DelegateExecution.class);
        when(execution.getVariable("modelId")).thenReturn(teamTask.getId());

        // Act
        FullContext result = wkfUserActionService.getModelCtx(wkfTaskConfig, execution);

        // Assert
        assertNotNull(result, "FullContext should not be null");
        assertEquals(teamTask.getId(), result.get("id"), "ID should match");
        assertEquals(teamTask.getName(), result.get("name"), "Name should match");
    }

    @Test
    void testGetModelCtxShouldFetchRecordByJsonModelName() throws Exception {
        // Arrange
        WkfTaskConfig wkfTaskConfig = mock(WkfTaskConfig.class);
        MetaJsonRecord metaJsonRecord = metaJsonRecordRepository.all().fetchOne();

        when(wkfTaskConfig.getModelName()).thenReturn(null);
        when(wkfTaskConfig.getJsonModelName()).thenReturn(metaJsonRecord.getJsonModel());

        DelegateExecution execution = mock(DelegateExecution.class);
        when(execution.getVariable("modelId")).thenReturn(metaJsonRecord.getId());

        // Act
        FullContext result = wkfUserActionService.getModelCtx(wkfTaskConfig, execution);

        // Assert
        assertNotNull(result, "FullContext should not be null");
        assertEquals(metaJsonRecord.getId(), result.get("id"), "ID should match");
    }


}
