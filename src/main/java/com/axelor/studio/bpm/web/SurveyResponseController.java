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

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.service.survey.SurveyResponseService;
import com.axelor.studio.db.SurveyResponse;
import com.axelor.studio.db.repo.SurveyCampaignRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.utils.ExceptionTool;

public class SurveyResponseController {

  public void openSurveyForm(ActionRequest request, ActionResponse response) {

    try {
      SurveyResponse surveyResponse = request.getContext().asType(SurveyResponse.class);

      if (surveyResponse.getSurveyCampaign().getStatusSelect()
          == SurveyCampaignRepository.STATUS_CLOSED) {
        response.setInfo(I18n.get(StudioExceptionMessage.SURVEY_CAMPAIGN_CLOSED));
        response.setCanClose(true);
      } else {
        openNextForm(response, surveyResponse);
      }
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  private void openNextForm(ActionResponse response, SurveyResponse surveyResponse) {

    try {
      SurveyResponseService surveyResponseService = Beans.get(SurveyResponseService.class);
      MetaJsonRecord metaJsonRecord = surveyResponseService.getNextForm(surveyResponse);

      if (metaJsonRecord == null) {
        surveyResponseService.completeResponse(surveyResponse);
        response.setInfo(I18n.get(StudioExceptionMessage.SURVEY_RESPONSE_COMPLETED));
      } else {
        MetaJsonModel jsonModel =
            Beans.get(MetaJsonModelRepository.class).findByName(metaJsonRecord.getJsonModel());
        response.setView(
            ActionView.define(jsonModel.getTitle())
                .model(MetaJsonRecord.class.getName())
                .add("form", "custom-model-" + jsonModel.getName() + "-form")
                .param("show-toolbar", "false")
                .param("forceEdit", "true")
                .context("jsonModel", jsonModel.getName())
                .context("_showRecord", metaJsonRecord.getId())
                .map());
      }
      response.setCanClose(true);
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void submitSurveyForm(ActionRequest request, ActionResponse response) {

    try {
      MetaJsonRecord metaJsonRecord = request.getContext().asType(MetaJsonRecord.class);

      Beans.get(SurveyResponseService.class).submitForm(metaJsonRecord);

      openNextForm(response, metaJsonRecord.getSurveyResponse());
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }
}
