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
package com.axelor.studio.bpm.service.survey;

import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonRecordRepository;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.service.execution.WkfTaskService;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.SurveyLine;
import com.axelor.studio.db.SurveyResponse;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.SurveyLineRepository;
import com.axelor.studio.db.repo.SurveyResponseRepository;
import com.axelor.studio.db.repo.WkfTaskConfigRepository;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.List;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.task.Task;

public class SurveyResponseServiceImpl implements SurveyResponseService {

  protected SurveyResponseRepository surveyResponseRepository;

  protected MetaJsonRecordRepository metaJsonRecordRepository;

  protected SurveyLineRepository surveyLineRepository;

  protected WkfInstanceService wkfInstanceService;

  protected ProcessEngineService processEngineService;

  protected WkfTaskService wkfTaskService;

  protected WkfTaskConfigRepository wkfTaskConfigRepository;

  @Inject
  public SurveyResponseServiceImpl(
      SurveyResponseRepository surveyResponseRepository,
      MetaJsonRecordRepository metaJsonRecordRepository,
      SurveyLineRepository surveyLineRepository,
      WkfInstanceService wkfInstanceService,
      ProcessEngineService processEngineService,
      WkfTaskService wkfTaskService,
      WkfTaskConfigRepository wkfTaskConfigRepository) {

    this.surveyResponseRepository = surveyResponseRepository;
    this.metaJsonRecordRepository = metaJsonRecordRepository;
    this.surveyLineRepository = surveyLineRepository;
    this.wkfInstanceService = wkfInstanceService;
    this.processEngineService = processEngineService;
    this.wkfTaskService = wkfTaskService;
    this.wkfTaskConfigRepository = wkfTaskConfigRepository;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public MetaJsonRecord getNextForm(SurveyResponse surveyResponse) {

    if (surveyResponse == null || surveyResponse.getId() == null) {
      return null;
    }

    surveyResponse = surveyResponseRepository.find(surveyResponse.getId());

    MetaJsonRecord metaJsonRecord =
        metaJsonRecordRepository
            .all()
            .filter(
                "self.surveyResponse.id = ?1 AND (self.isSubmitted is false OR self.isSubmitted IS NULL)",
                surveyResponse.getId())
            .fetchOne();

    if (metaJsonRecord != null) {
      return metaJsonRecord;
    }

    SurveyLine surveyLine = findSurveyLine(surveyResponse);

    if (surveyLine == null) {
      return null;
    }

    metaJsonRecord = new MetaJsonRecord();
    metaJsonRecord.setJsonModel(surveyLine.getMetaJsonModel().getName());
    metaJsonRecord.setSurveyResponse(surveyResponse);
    metaJsonRecordRepository.save(metaJsonRecord);

    return metaJsonRecord;
  }

  protected SurveyLine findSurveyLine(SurveyResponse surveyResponse) {

    Long surveyId = surveyResponse.getSurveyCampaign().getSurvey().getId();

    if (Boolean.TRUE.equals(surveyResponse.getIsBpm())) {
      return findBpmSurveyLine(surveyResponse);
    }

    return surveyLineRepository
        .all()
        .filter(
            "self.metaJsonModel.name NOT IN (SELECT jsonModel FROM MetaJsonRecord WHERE surveyResponse.id = ?1) AND self.survey.id = ?2",
            surveyResponse.getId(),
            surveyId)
        .order("sequence")
        .fetchOne();
  }

  protected SurveyLine findBpmSurveyLine(SurveyResponse surveyResponse) {

    ProcessEngine processEngine = processEngineService.getEngine();

    List<Task> activeTasks =
        wkfTaskService.getActiveTasks(processEngine, surveyResponse.getProcessInstanceId());

    for (Task task : activeTasks) {
      WkfTaskConfig taskConfig =
          wkfTaskConfigRepository
              .all()
              .filter("self.name = ?1", task.getTaskDefinitionKey())
              .fetchOne();
      String formView = taskConfig.getDefaultForm();
      if (formView != null) {
        return surveyLineRepository
            .all()
            .filter("self.metaJsonModel.name = ?1", formView.split("-")[2])
            .fetchOne();
      }
    }

    return null;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void completeResponse(SurveyResponse surveyResponse) {

    if (surveyResponse == null || surveyResponse.getId() == null) {
      return;
    }

    surveyResponse = surveyResponseRepository.find(surveyResponse.getId());
    surveyResponse.setIsCompleted(true);

    surveyResponseRepository.save(surveyResponse);
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void submitForm(MetaJsonRecord metaJsonRecord) {

    if (metaJsonRecord == null || metaJsonRecord.getId() == null) {
      return;
    }

    metaJsonRecord = metaJsonRecordRepository.find(metaJsonRecord.getId());

    metaJsonRecord.setIsSubmitted(true);
    metaJsonRecordRepository.save(metaJsonRecord);
  }
}
