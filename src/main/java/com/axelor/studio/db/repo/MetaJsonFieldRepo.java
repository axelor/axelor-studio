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

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.service.JsonFieldService;
import com.axelor.studio.service.StudioMetaService;
import com.google.inject.Inject;

public class MetaJsonFieldRepo extends MetaJsonFieldRepository {

  protected MetaModelRepository metaModelRepo;
  protected JsonFieldService jsonFieldService;

  @Inject
  public MetaJsonFieldRepo(MetaModelRepository metaModelRepo, JsonFieldService jsonFieldService) {
    this.metaModelRepo = metaModelRepo;
    this.jsonFieldService = jsonFieldService;
  }

  @Override
  public MetaJsonField save(MetaJsonField metaJsonField) {

    StudioApp studioApp = metaJsonField.getStudioApp();
    if (studioApp != null && (metaJsonField.getIncludeIf() == null || metaJsonField.getIncludeIf().isEmpty())) {
      metaJsonField.setIncludeIf("__config__.app?.isApp('" + studioApp.getCode() + "')");
    }
    jsonFieldService.updateSelection(metaJsonField);

    return super.save(metaJsonField);
  }

  @Override
  public void remove(MetaJsonField metaJsonField) {

    if (metaJsonField.getJsonModel() == null) {

      MetaModel metaModel =
          metaModelRepo.all().filter("self.fullName = ?1", metaJsonField.getModel()).fetchOne();

      Beans.get(StudioMetaService.class)
          .trackingFields(metaModel, metaJsonField.getName(), "Field removed");
    }

    jsonFieldService.removeSelection(metaJsonField);

    super.remove(metaJsonField);
  }
}
