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
package com.axelor.studio.bpm.web;

import com.axelor.auth.db.repo.UserRepository;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.survey.SurveyCampaignService;
import com.axelor.studio.db.Survey;
import com.axelor.studio.db.SurveyCampaign;
import com.axelor.studio.db.repo.SurveyCampaignRepository;
import com.axelor.studio.db.repo.SurveyRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.ExceptionTool;
import com.google.inject.Inject;
import java.util.List;

public class SurveyCampaignController {

  protected final AppSettingsStudioService appSettingsStudioService;

  @Inject
  public SurveyCampaignController(AppSettingsStudioService appSettingsStudioService) {
    this.appSettingsStudioService = appSettingsStudioService;
  }

  public void startCampaign(ActionRequest request, ActionResponse response) {

    try {
      SurveyCampaign surveyCampaign = request.getContext().asType(SurveyCampaign.class);

      Beans.get(SurveyCampaignService.class).startCampaign(surveyCampaign);

      response.setCanClose(true);
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void closeCampaign(ActionRequest request, ActionResponse response) {

    try {
      response.setValue("statusSelect", SurveyCampaignRepository.STATUS_CLOSED);
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void setCampaignSurveyFormList(ActionRequest request, ActionResponse response) {

    try {
      SurveyCampaign suryCampaign = request.getContext().asType(SurveyCampaign.class);

      Survey survey = suryCampaign.getSurvey();

      if (survey == null) {
        response.setValue("$surveyFormList", null);
      } else {
        survey = Beans.get(SurveyRepository.class).find(survey.getId());

        SurveyCampaignService surveyCampaignService = Beans.get(SurveyCampaignService.class);

        long totalSent = surveyCampaignService.countResponse(suryCampaign, null, false, false);
        long totalCompleted = surveyCampaignService.countResponse(suryCampaign, null, true, false);
        long totalPartiallyCompleted =
            surveyCampaignService.countResponse(suryCampaign, null, false, true);
        long totalNotCompleted = totalSent - totalCompleted - totalPartiallyCompleted;
        List<Object> formList =
            surveyCampaignService.computeFormList(
                suryCampaign, survey, surveyCampaignService, totalSent);

        response.setValue("$totalSent", totalSent);
        response.setValue("$totalCompleted", totalCompleted);
        response.setValue("$totalPartiallyCompleted", totalPartiallyCompleted);
        response.setValue("$totalNotCompleted", totalNotCompleted);
        response.setValue("$surveyFormList", formList);
      }
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void openForm(ActionRequest request, ActionResponse response) {

    try {
      MetaJsonRecord metaJsonRecord = request.getContext().asType(MetaJsonRecord.class);

      String jsonModel = metaJsonRecord.getJsonModel();

      response.setView(
          ActionView.define(jsonModel)
              .model(MetaJsonRecord.class.getName())
              .add("form", "custom-model-" + jsonModel + "-form")
              .param("popup", "true")
              .param("show-toolbar", "false")
              .param("popup-save", "false")
              .param("show-confirm", "false")
              .context("jsonModel", jsonModel)
              .map());
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void validateSurveyUser(ActionRequest request, ActionResponse response) {
    try {
      if (appSettingsStudioService.surveyPublicUser() == null
          || appSettingsStudioService.surveyPublicPassword() == null
          || Beans.get(UserRepository.class).findByCode(appSettingsStudioService.surveyPublicUser())
              == null) {
        response.setAlert(StudioExceptionMessage.SURVEY_PUBLIC_USER_NOT_EXIST);
      }
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }
}
