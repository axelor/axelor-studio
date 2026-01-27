/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
import jakarta.inject.Inject;

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
    if (studioApp != null
        && (metaJsonField.getIncludeIf() == null || metaJsonField.getIncludeIf().isEmpty())) {
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
