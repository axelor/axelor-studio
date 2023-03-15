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

import com.axelor.studio.db.Survey;
import com.axelor.studio.db.SurveyCampaign;
import java.util.List;
import javax.mail.MessagingException;

public interface SurveyCampaignService {

  String SURVEY_USER_PROP = "survey.public.user";
  String SURVEY_PASSWORD_PROP = "survey.public.password";

  void startCampaign(SurveyCampaign surveyCampaign)
      throws ClassNotFoundException, MessagingException;

  void generateEmptyResponse(
      SurveyCampaign surveyCampaign, String emailAddress, String token, boolean isBpm);

  long countResponse(
      SurveyCampaign surveyCampaign, String model, boolean completed, boolean partial);

  List<Object> computeFormList(
      SurveyCampaign suryCampaign,
      Survey survey,
      SurveyCampaignService surveyCampaignService,
      long totalSent);
}
