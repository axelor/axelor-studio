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

import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.dmn.service.DmnService;
import com.google.inject.Inject;

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
