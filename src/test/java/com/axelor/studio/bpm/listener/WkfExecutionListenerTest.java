/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.listener;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.db.Query;
import com.axelor.studio.bpm.service.BpmAsyncExecutorService;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.log.WkfLogService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfProcessRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.axelor.studio.service.AppSettingsStudioService;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WkfExecutionListenerTest {

  private WkfExecutionListener listener;
  private WkfProcessRepository wkfProcessRepo;
  private WkfTaskConfigRepository wkfTaskConfigRepo;
  private WkfInstanceRepository wkfInstanceRepo;
  private DelegateExecution execution;

  @BeforeEach
  void setUp() {
    wkfInstanceRepo = mock(WkfInstanceRepository.class);
    WkfInstanceService wkfInstanceService = mock(WkfInstanceService.class);
    wkfProcessRepo = mock(WkfProcessRepository.class);
    wkfTaskConfigRepo = mock(WkfTaskConfigRepository.class);
    WkfLogService wkfLogService = mock(WkfLogService.class);
    AppSettingsStudioService appSettings = mock(AppSettingsStudioService.class);
    WkfCommonService wkfCommonService = mock(WkfCommonService.class);
    BpmAsyncExecutorService bpmAsyncExecutor = mock(BpmAsyncExecutorService.class);

    listener =
        new WkfExecutionListener(
            wkfInstanceRepo,
            wkfInstanceService,
            wkfProcessRepo,
            wkfTaskConfigRepo,
            wkfLogService,
            appSettings,
            wkfCommonService,
            bpmAsyncExecutor);

    execution = mock(DelegateExecution.class);
  }

  // --- createWkfInstance tests ---

  @Test
  void createWkfInstance_shouldResolveByExactProcessId() {
    String processDefId = "Process_abc:2:456";
    when(execution.getProcessDefinitionId()).thenReturn(processDefId);
    when(execution.getVariable("modelId")).thenReturn(1L);
    when(execution.getVariable("modelName")).thenReturn("com.example.Model");

    WkfProcess wkfProcess = new WkfProcess();
    wkfProcess.setProcessId(processDefId);

    Query<WkfProcess> query = mockQuery(wkfProcess);
    when(wkfProcessRepo.all()).thenReturn(query);
    when(wkfInstanceRepo.save(any(WkfInstance.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    WkfInstance result = listener.createWkfInstance(execution, "instance-1", wkfInstanceRepo);

    assertNotNull(result);
    assertEquals(processDefId + " : instance-1", result.getName());
    assertEquals(wkfProcess, result.getWkfProcess());
  }

  @Test
  void createWkfInstance_shouldThrow_whenProcessNotFound() {
    String processDefId = "Unknown_proc:1:999";
    when(execution.getProcessDefinitionId()).thenReturn(processDefId);

    Query<WkfProcess> query = mockQuery(null);
    when(wkfProcessRepo.all()).thenReturn(query);

    IllegalStateException exception =
        assertThrows(
            IllegalStateException.class,
            () -> listener.createWkfInstance(execution, "instance-3", wkfInstanceRepo));

    assertEquals("No WkfProcess found for definition: Unknown_proc:1:999", exception.getMessage());
  }

  // --- getWkfTaskConfig tests ---

  @Test
  void getWkfTaskConfig_shouldQueryByProcessDefinitionId() {
    String processDefId = "MyProcess:3:abc";
    when(execution.getProcessDefinitionId()).thenReturn(processDefId);
    when(execution.getCurrentActivityId()).thenReturn("StartEvent_1");
    when(execution.getProcessInstanceId()).thenReturn("inst-1");

    WkfTaskConfig taskConfig = new WkfTaskConfig();
    Query<WkfTaskConfig> query = mockQueryWithAutoFlush(taskConfig);
    when(wkfTaskConfigRepo.all()).thenReturn(query);

    WkfTaskConfig result = listener.getWkfTaskConfig(execution);

    assertNotNull(result);
  }

  @Test
  void getWkfTaskConfig_shouldReturnNull_whenNotFound() {
    String processDefId = "MyProcess:1:def";
    when(execution.getProcessDefinitionId()).thenReturn(processDefId);
    when(execution.getCurrentActivityId()).thenReturn("Task_1");
    when(execution.getProcessInstanceId()).thenReturn("inst-2");

    Query<WkfTaskConfig> query = mockQueryWithAutoFlush(null);
    when(wkfTaskConfigRepo.all()).thenReturn(query);

    WkfTaskConfig result = listener.getWkfTaskConfig(execution);

    assertEquals(null, result);
  }

  // --- Helpers ---

  @SuppressWarnings("unchecked")
  private <T extends com.axelor.db.Model> Query<T> mockQuery(T result) {
    Query<T> query = mock(Query.class);
    when(query.filter(any(String.class), any())).thenReturn(query);
    when(query.fetchOne()).thenReturn(result);
    return query;
  }

  @SuppressWarnings("unchecked")
  private <T extends com.axelor.db.Model> Query<T> mockQueryWithAutoFlush(T result) {
    Query<T> query = mock(Query.class, org.mockito.Mockito.RETURNS_SELF);
    when(query.fetchOne()).thenReturn(result);
    return query;
  }
}
