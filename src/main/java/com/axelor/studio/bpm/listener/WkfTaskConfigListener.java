/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.listener;

import com.axelor.studio.bpm.utils.BpmTools;
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
