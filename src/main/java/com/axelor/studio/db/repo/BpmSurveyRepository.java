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

import com.axelor.i18n.I18n;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.db.Survey;
import com.axelor.studio.db.SurveyLine;
import com.axelor.utils.WrapUtils;
import com.google.inject.Inject;
import java.util.Objects;
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
        MetaJsonModel metaJsonModel = surveyLine.getMetaJsonModel();
        if (WrapUtils.wrap(metaJsonModel.getFields()).stream()
            .map(MetaJsonField::getOnClick)
            .filter(Objects::nonNull)
            .noneMatch(it -> it.contains("action-submit-survey-response"))) {
          throw new IllegalStateException(I18n.get(BpmExceptionMessage.NO_SUBMIT_BTN_FOUND));
        }
      }
    }

    return super.save(survey);
  }

  @Override
  public void remove(Survey survey) {
    super.remove(survey);

    if (CollectionUtils.isNotEmpty(survey.getSurveyLineList())) {
      survey
          .getSurveyLineList()
          .forEach(it -> metaJsonModelRepository.remove(it.getMetaJsonModel()));
    }
  }
}
