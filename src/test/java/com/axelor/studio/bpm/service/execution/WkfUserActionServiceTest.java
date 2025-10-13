package com.axelor.studio.bpm.service.execution;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.anyMap;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;

import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.Inject;
import java.util.HashMap;
import java.util.Map;

import com.google.inject.persist.Transactional;
import org.camunda.bpm.engine.RuntimeService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.task.Task;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;


public class WkfUserActionServiceTest extends BaseTest {

    @Inject private WkfUserActionServiceImpl wkfUserActionService;
    @Inject private TeamTaskRepository teamTaskRepository;

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

        try (MockedStatic<ExceptionHelper> mocked =
                     mockStatic(ExceptionHelper.class)) {

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
        assertDoesNotThrow(() ->
                spyService.migrateTeamTaskOnProcessMigration(task, null, "proc123", processEngine)
        );

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

        doNothing().when(spyService).cancelExistingTask(wkfTaskConfig, "proc123");

        FullContext mockContext = mock(FullContext.class);
        doReturn(mockContext)
                .when(spyService)
                .extractWkfContextFromVariables(wkfTaskConfig, contextVars);

        TeamTask newTask = new TeamTask();
        newTask.setName("task");

        doReturn(newTask)
                .when(spyService)
                .buildTeamTask(
                        mockContext,
                        wkfTaskConfig,
                        contextVars,
                        "proc123",
                        "def123",
                        "Review Order");

        try (MockedStatic<ExceptionHelper> mocked =
                     mockStatic(ExceptionHelper.class)) {

            // Act
            spyService.migrateTeamTaskOnProcessMigration(
                    mockTask, wkfTaskConfig, "proc123", processEngine);

            // Assert
            assertNotNull(newTask);
            verify(spyService, times(1))
                    .buildMigrationContextVariables(wkfTaskConfig, "proc123", processEngine);
            verify(spyService, times(1)).cancelExistingTask(wkfTaskConfig, "proc123");
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
        doNothing().when(spyService).cancelExistingTask(wkfTaskConfig, "procNull");
        doReturn(mock(FullContext.class))
                .when(spyService)
                .extractWkfContextFromVariables(wkfTaskConfig, ctxVars);

        doReturn(null)
                .when(spyService)
                .buildTeamTask(
                        any(), eq(wkfTaskConfig), eq(ctxVars), eq("procNull"), eq("defNull"), eq("Null Builder"));

        try (MockedStatic<ExceptionHelper> mocked =
                     mockStatic(ExceptionHelper.class)) {

            // Act
            spyService.migrateTeamTaskOnProcessMigration(
                    mockTask, wkfTaskConfig, "procNull", processEngine);

            // Assert
            verify(spyService, times(1))
                    .buildTeamTask(any(), eq(wkfTaskConfig), eq(ctxVars), eq("procNull"), eq("defNull"), eq("Null Builder"));
        }
    }
}
