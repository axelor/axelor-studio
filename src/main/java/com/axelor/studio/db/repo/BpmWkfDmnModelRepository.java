/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.dmn.service.DmnService;
import jakarta.inject.Inject;

public class BpmWkfDmnModelRepository extends WkfDmnModelRepository {

  protected DmnService dmnService;

  @Inject
  public BpmWkfDmnModelRepository(DmnService dmnService) {
    this.dmnService = dmnService;
  }

  @Override
  public WkfDmnModel copy(WkfDmnModel entity, boolean deep) {
    entity = super.copy(entity, deep);
    dmnService.renameDiagramIds(entity);
    entity.clearDmnTableList();
    return entity;
  }
}
