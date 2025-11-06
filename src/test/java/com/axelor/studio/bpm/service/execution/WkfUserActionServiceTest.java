package com.axelor.studio.bpm.service.execution;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonRecordRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.team.db.TeamTask;
import com.axelor.team.db.repo.TeamTaskRepository;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.Inject;
import org.camunda.bpm.engine.delegate.DelegateExecution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

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
