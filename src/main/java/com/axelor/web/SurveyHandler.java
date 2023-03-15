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
package com.axelor.web;

import com.axelor.app.AppSettings;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.studio.db.SurveyResponse;
import com.axelor.studio.db.repo.SurveyCampaignRepository;
import com.axelor.studio.db.repo.SurveyResponseRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.utils.ExceptionTool;
import java.net.URI;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Response;

@Path("/survey")
public class SurveyHandler {

  @GET
  @Path("/{token}")
  public Response openSurvey(@PathParam("token") String token) {

    try {
      String redirectUrl = AppSettings.get().getBaseURL();

      if (token != null) {

        SurveyResponse surveyResponse =
            Beans.get(SurveyResponseRepository.class)
                .all()
                .filter("self.token = ?1", token)
                .fetchOne();

        if (surveyResponse != null) {
          if (surveyResponse.getSurveyCampaign().getStatusSelect()
              == SurveyCampaignRepository.STATUS_CLOSED) {
            return Response.serverError()
                .entity(I18n.get(StudioExceptionMessage.SURVEY_CAMPAIGN_CLOSED))
                .build();
          } else {
            redirectUrl += "/#/ds/survey.response.all/edit/" + surveyResponse.getId();
          }
        }
      }

      return Response.temporaryRedirect(new URI(redirectUrl)).build();
    } catch (Exception e) {
      ExceptionTool.trace(e);
    }
    return Response.serverError().build();
  }
}
