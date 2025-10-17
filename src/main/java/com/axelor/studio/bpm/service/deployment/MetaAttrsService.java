/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.meta.db.MetaAttrs;
import com.axelor.studio.db.WkfTaskConfig;
import com.google.inject.persist.Transactional;
import java.util.List;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;

public interface MetaAttrsService {

  List<MetaAttrs> createMetaAttrs(
      String taskName,
      ModelElementInstance modelElementInstance,
      WkfTaskConfig config,
      String wkfModelId);

  @Transactional
  void saveMetaAttrs(List<MetaAttrs> metaAttrsList, Long wkfModelId);
}
