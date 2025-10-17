/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.context;

import com.axelor.db.JPA;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.apache.commons.collections.MultiMap;
import org.apache.commons.collections.map.MultiValueMap;

public class WkfCache {

  public static Map<String, Map<Long, String>> WKF_MODEL_CACHE = new ConcurrentHashMap<>();
  public static Map<String, MultiMap> WKF_BUTTON_CACHE = new ConcurrentHashMap<>();

  public static void initWkfModelCache() {

    List<WkfProcessConfig> wkfProcessConfigs = JPA.all(WkfProcessConfig.class).fetch();

    Map<Long, String> modelMap = new HashMap<>();
    modelMap.put(0L, "");
    wkfProcessConfigs.forEach(
        config -> {
          String model = config.getModel();
          if (config.getMetaJsonModel() != null) {
            model = config.getMetaJsonModel().getName();
          }
          modelMap.put(config.getId(), model);
        });
    WKF_MODEL_CACHE.put(BpmTools.getCurrentTenant(), modelMap);
  }

  public static void initWkfButttonCache() {

    List<WkfTaskConfig> wkfTaskConfigs = JPA.all(WkfTaskConfig.class).fetch();

    MultiMap multiMap = new MultiValueMap();
    multiMap.put(0L, null);
    wkfTaskConfigs.stream()
        .filter(config -> config.getButton() != null)
        .collect(Collectors.toMap(WkfTaskConfig::getId, WkfTaskConfig::getButton))
        .forEach(
            (configId, button) ->
                Arrays.asList(button.split(","))
                    .forEach(btnName -> multiMap.put(configId, btnName)));

    WKF_BUTTON_CACHE.put(BpmTools.getCurrentTenant(), multiMap);
  }
}
