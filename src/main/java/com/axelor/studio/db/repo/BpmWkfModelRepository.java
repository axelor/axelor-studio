/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.db.repo;

import com.axelor.studio.db.WkfModel;

public class BpmWkfModelRepository extends WkfModelRepository {

  @Override
  public WkfModel copy(WkfModel entity, boolean deep) {

    WkfModel copyModel = super.copy(entity, deep);
    copyModel.setWkfProcessList(null);
    copyModel.setWkfTaskConfigList(null);
    copyModel.setStatusSelect(WkfModelRepository.STATUS_NEW);

    return copyModel;
  }

  @Override
  public void remove(WkfModel entity) {

    if (entity.getPreviousVersion() != null) {
      remove(entity.getPreviousVersion());
    }

    super.remove(entity);
  }
}
