/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.db.Model;
import com.axelor.studio.bpm.service.WkfCommonService;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.google.inject.Inject;
import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BpmAuthorizationServiceImpl implements BpmAuthorizationService {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final WkfInstanceRepository wkfInstanceRepo;
  private final WkfCommonService wkfCommonService;

  private final ConcurrentHashMap<String, AuthorizationResult> cache = new ConcurrentHashMap<>();

  @Inject
  public BpmAuthorizationServiceImpl(
      WkfInstanceRepository wkfInstanceRepo, WkfCommonService wkfCommonService) {
    this.wkfInstanceRepo = wkfInstanceRepo;
    this.wkfCommonService = wkfCommonService;
  }

  @Override
  public boolean canUserTriggerProcess(User user, WkfModel wkfModel) {
    if (user == null || wkfModel == null) {
      return false;
    }
    if (Boolean.TRUE.equals(user.getIsBpmAdministrator())) {
      return true;
    }
    return computeAuthorization(user, wkfModel).canTriggerProcess();
  }

  @Override
  public List<Map<String, Object>> filterWkfStatus(
      User user, Model record, List<Map<String, Object>> wkfStatusList) {
    if (user == null || record == null || wkfStatusList == null || wkfStatusList.isEmpty()) {
      return Collections.emptyList();
    }
    if (Boolean.TRUE.equals(user.getIsBpmAdministrator())) {
      return wkfStatusList;
    }

    WkfModel wkfModel = resolveWkfModelForRecord(record);
    if (wkfModel == null) {
      return wkfStatusList;
    }

    AuthorizationResult result = computeAuthorization(user, wkfModel);
    if (result.canViewStatus()) {
      return wkfStatusList;
    }

    log.debug(
        "User {} not authorized to view $wkfStatus for record {}#{}",
        user.getCode(),
        record.getClass().getSimpleName(),
        record.getId());
    return Collections.emptyList();
  }

  @Override
  public AuthorizationResult computeAuthorization(User user, WkfModel wkfModel) {
    String cacheKey = user.getId() + ":" + wkfModel.getId();
    return cache.computeIfAbsent(cacheKey, k -> doComputeAuthorization(user, wkfModel));
  }

  @Override
  public WkfModel resolveWkfModelForRecord(Model record) {
    if (record == null) {
      return null;
    }

    String processInstanceId = record.getProcessInstanceId();
    if (processInstanceId != null) {
      WkfInstance wkfInstance = wkfInstanceRepo.findByInstanceId(processInstanceId);
      if (wkfInstance != null && wkfInstance.getWkfProcess() != null) {
        return wkfInstance.getWkfProcess().getWkfModel();
      }
    }

    WkfProcessConfig config = wkfCommonService.findCurrentProcessConfig(record);
    if (config != null && config.getWkfProcess() != null) {
      return config.getWkfProcess().getWkfModel();
    }

    return null;
  }

  @Override
  public void invalidateCache(WkfModel wkfModel) {
    if (wkfModel == null) {
      return;
    }
    String suffix = ":" + wkfModel.getId();
    cache.keySet().removeIf(key -> key.endsWith(suffix));
  }

  private AuthorizationResult doComputeAuthorization(User user, WkfModel wkfModel) {
    boolean isAdmin = checkUserInSets(user, wkfModel.getAdminUserSet(), wkfModel.getAdminRoleSet());
    boolean isUser = checkUserInSets(user, wkfModel.getUserSet(), wkfModel.getRoleSet());
    return new AuthorizationResult(isAdmin, isUser);
  }

  private boolean checkUserInSets(User user, Set<User> userSet, Set<Role> roleSet) {
    if (userSet != null && userSet.contains(user)) {
      return true;
    }
    if (roleSet != null && user.getRoles() != null) {
      return roleSet.stream().anyMatch(user.getRoles()::contains);
    }
    return false;
  }
}
