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
package com.axelor.studio.dmn.service;

import com.axelor.db.Model;
import com.axelor.studio.db.WkfDmnModel;

public interface DmnService {

  public void executeDmn(String decisionDefinitionId, Model model);

  public String createOutputToFieldScript(
      String decisionDefinitionId,
      String modelName,
      String searchOperator,
      String ifMultiple,
      String resultVar);

  public void renameDiagramIds(WkfDmnModel wkfDmnModel);
}
