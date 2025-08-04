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
package com.axelor.studio.bpm.listener;

import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.context.WkfCache;
import com.axelor.studio.db.WkfTaskConfig;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import java.util.Arrays;
import org.apache.commons.collections.map.MultiValueMap;

public class WkfTaskConfigListener {

  @PostPersist
  @PostUpdate
  public void onSave(WkfTaskConfig config) {
    if (config.getButton() != null) {
      String tenantId = BpmTools.getCurrentTenant();
      if (!WkfCache.WKF_BUTTON_CACHE.containsKey(tenantId)) {
        WkfCache.WKF_BUTTON_CACHE.put(tenantId, new MultiValueMap());
      }
      onRemove(config);
      Arrays.asList(config.getButton().split(","))
          .forEach(btnName -> WkfCache.WKF_BUTTON_CACHE.get(tenantId).put(config.getId(), btnName));
    }
  }

  @PostRemove
  public void onRemove(WkfTaskConfig config) {

    String tenantId = BpmTools.getCurrentTenant();
    if (WkfCache.WKF_BUTTON_CACHE.containsKey(tenantId)) {
      WkfCache.WKF_BUTTON_CACHE.get(tenantId).remove(config.getId());
    }
  }
}
