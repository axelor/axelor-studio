/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.db.Model;
import com.axelor.studio.db.WkfDmnModel;

public interface DmnService {

  void executeDmn(String decisionDefinitionId, Model model);

  String createOutputToFieldScript(
      String decisionDefinitionId,
      String modelName,
      String searchOperator,
      String ifMultiple,
      String resultVar);

  void renameDiagramIds(WkfDmnModel wkfDmnModel);
}
