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
package com.axelor.studio.db.repo;

import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.db.Survey;
import com.axelor.studio.db.SurveyLine;
import com.google.inject.Inject;
import org.apache.commons.collections.CollectionUtils;

public class BpmSurveyRepository extends SurveyRepository {

  protected MetaJsonModelRepository metaJsonModelRepository;
  protected MetaViewRepository metaViewRepository;

  @Inject
  public BpmSurveyRepository(
      MetaJsonModelRepository metaJsonModelRepository, MetaViewRepository metaViewRepository) {
    this.metaJsonModelRepository = metaJsonModelRepository;
    this.metaViewRepository = metaViewRepository;
  }

  @Override
  public Survey save(Survey survey) {

    if (CollectionUtils.isEmpty(survey.getSurveyLineList())) {
      return super.save(survey);
    }

    for (SurveyLine surveyLine : survey.getSurveyLineList()) {
      if (surveyLine.getMetaJsonModel() != null) {
        surveyLine.getMetaJsonModel().setFormWidth("large");
        metaJsonModelRepository.save(surveyLine.getMetaJsonModel());
        MetaView metaView =
            metaViewRepository.findByName(
                "custom-model-" + surveyLine.getMetaJsonModel().getName() + "-form");
        if (metaView != null) {
          String xml = metaView.getXml();

          if (!xml.contains("<button name=\"_submit\"")) {
            xml =
                xml.replace(
                    "</panel>",
                    "<button name=\"_submit\" title=\"Submit\" onClick=\"save,action-survey-response-method-submit-survey-form\" colSpan=\"3\" hideIf=\"$popup()\" /></panel>");
            metaView.setXml(xml);
            metaViewRepository.save(metaView);
          }
        }
      }
    }

    return super.save(survey);
  }

  @Override
  public void remove(Survey survey) {
    super.remove(survey);

    if (CollectionUtils.isNotEmpty(survey.getSurveyLineList())) {
      survey.getSurveyLineList()
          .forEach(it -> metaJsonModelRepository.remove(it.getMetaJsonModel()));
    }
  }
}
