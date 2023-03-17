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

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.message.db.EmailAddress;
import com.axelor.message.db.Message;
import com.axelor.message.db.Template;
import com.axelor.message.service.MessageService;
import com.axelor.message.service.TemplateMessageService;
import com.axelor.meta.db.repo.MetaJsonRecordRepository;
import com.axelor.studio.db.AppSurvey;
import com.axelor.studio.db.Survey;
import com.axelor.studio.db.SurveyCampaign;
import com.axelor.studio.db.SurveyLine;
import com.axelor.studio.db.SurveyResponse;
import com.axelor.studio.db.repo.AppSurveyRepository;
import com.axelor.studio.db.repo.SurveyCampaignRepository;
import com.axelor.studio.db.repo.SurveyResponseRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.WrapUtils;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.mail.MessagingException;

public class SurveyCampaignServiceImpl implements SurveyCampaignService {

  protected SurveyCampaignRepository surveyCampaignRepository;

  protected SurveyResponseRepository surveyResponseRepository;

  protected TemplateMessageService templateMessageService;

  protected MessageService messageService;

  protected MetaJsonRecordRepository metaJsonRecordRepository;

  protected final AppSettingsStudioService appSettingsStudioService;

  @Inject
  public SurveyCampaignServiceImpl(
      SurveyCampaignRepository surveyCampaignRepository,
      SurveyResponseRepository surveyResponseRepository,
      TemplateMessageService templateMessageService,
      MessageService messageService,
      MetaJsonRecordRepository metaJsonRecordRepository,
      AppSettingsStudioService appSettingsStudioService) {

    this.surveyCampaignRepository = surveyCampaignRepository;
    this.surveyResponseRepository = surveyResponseRepository;
    this.templateMessageService = templateMessageService;
    this.messageService = messageService;
    this.metaJsonRecordRepository = metaJsonRecordRepository;
    this.appSettingsStudioService = appSettingsStudioService;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void startCampaign(SurveyCampaign surveyCampaign)
      throws ClassNotFoundException, MessagingException {

    if (surveyCampaign == null || surveyCampaign.getId() == null) {
      return;
    }

    surveyCampaign = surveyCampaignRepository.find(surveyCampaign.getId());

    AppSurvey appSurvey = Beans.get(AppSurveyRepository.class).all().fetchOne();

    if (appSurvey.getSurveyEmailTemplate() == null) {
      throw new IllegalStateException(I18n.get(StudioExceptionMessage.NO_SURVEY_EMAIL_TEMPLATE));
    }

    long bpmProcessCount =
        Beans.get(WkfProcessConfigRepository.class)
            .all()
            .filter(
                "self.wkfProcess.wkfModel.statusSelect = ?1 AND self.wkfProcess.wkfModel.isSurvey is true AND self.wkfProcess.wkfModel.survey.id = ?2",
                WkfModelRepository.STATUS_ON_GOING,
                surveyCampaign.getSurvey().getId())
            .count();

    for (EmailAddress emailAddress : WrapUtils.wrap(surveyCampaign.getSendToEmailAddressSet())) {
      String token = UUID.randomUUID().toString();
      generateEmptyResponse(surveyCampaign, emailAddress.getAddress(), token, bpmProcessCount > 0);
      sendSurveyEmail(surveyCampaign, appSurvey.getSurveyEmailTemplate(), emailAddress, token);
    }

    surveyCampaign.setStatusSelect(SurveyCampaignRepository.STATUS_RUNNING);

    surveyCampaignRepository.save(surveyCampaign);
  }

  @Transactional(rollbackOn = Exception.class)
  @Override
  public void generateEmptyResponse(
      SurveyCampaign surveyCampaign, String emailAddress, String token, boolean isBpm) {

    SurveyResponse surveyResponse = new SurveyResponse();
    surveyResponse.setSurveyCampaign(surveyCampaign);
    surveyResponse.setEmail(emailAddress);
    surveyResponse.setToken(token);
    surveyResponse.setIsBpm(isBpm);

    surveyResponseRepository.save(surveyResponse);
  }

  protected void sendSurveyEmail(
      SurveyCampaign surveyCampaign, Template template, EmailAddress emailAddress, String token)
      throws ClassNotFoundException, MessagingException {

    Message message = templateMessageService.generateMessage(surveyCampaign, template);
    Set<EmailAddress> toEmailIds = new HashSet<>();
    toEmailIds.add(emailAddress);
    message.setToEmailAddressSet(toEmailIds);
    String surveyLink = appSettingsStudioService.baseUrl();
    surveyLink +=
        (Boolean.TRUE.equals(surveyCampaign.getIsPublicSurvey())
                ? "/ws/public/survey/"
                : "/ws/survey/")
            + token;
    String content =
        message.getContent() != null
            ? message.getContent().replace("{_surveyLink}", surveyLink)
            : message.getContent();
    message.setContent(content);
    messageService.sendByEmail(message);
  }

  @Override
  public long countResponse(
      SurveyCampaign surveyCampaign, String model, boolean completed, boolean partial) {

    long count = 0;

    if (surveyCampaign == null) {
      return count;
    }

    if (model == null) {
      if (completed) {
        count =
            surveyResponseRepository
                .all()
                .filter(
                    "self.surveyCampaign.id = ?1 and self.isCompleted = true",
                    surveyCampaign.getId())
                .count();
      } else if (partial) {
        count =
            metaJsonRecordRepository
                .all()
                .filter(
                    "self.surveyResponse.surveyCampaign.id = ?1 and (self.isSubmitted = null OR self.isSubmitted is false)",
                    surveyCampaign.getId())
                .count();
      } else {
        count =
            surveyResponseRepository
                .all()
                .filter("self.surveyCampaign.id = ?1", surveyCampaign.getId())
                .count();
      }
    } else {
      if (completed) {
        count =
            metaJsonRecordRepository
                .all()
                .filter(
                    "self.surveyResponse.surveyCampaign.id = ?1 and self.isSubmitted is true and self.jsonModel = ?2",
                    surveyCampaign.getId(),
                    model)
                .count();
      } else if (partial) {
        count =
            metaJsonRecordRepository
                .all()
                .filter(
                    "self.surveyResponse.surveyCampaign.id = ?1 and (self.isSubmitted = null OR self.isSubmitted is false) and self.jsonModel = ?2",
                    surveyCampaign.getId(),
                    model)
                .count();
      }
    }

    return count;
  }

  @Override
  public List<Object> computeFormList(
      SurveyCampaign suryCampaign,
      Survey survey,
      SurveyCampaignService surveyCampaignService,
      long totalSent) {
    List<Object> formList = new ArrayList<>();
    for (SurveyLine surveyLine : survey.getSurveyLineList()) {
      Map<String, Object> record = new HashMap<>();
      String jsonModel = surveyLine.getMetaJsonModel().getName();
      record.put("jsonModel", jsonModel);
      long completed = surveyCampaignService.countResponse(suryCampaign, jsonModel, true, false);
      long partial = surveyCampaignService.countResponse(suryCampaign, jsonModel, false, true);
      record.put("totalCompleted", completed);
      record.put("totalPartiallyCompleted", partial);
      record.put("totalNotCompleted", totalSent - completed - partial);
      formList.add(record);
    }
    return formList;
  }
}
