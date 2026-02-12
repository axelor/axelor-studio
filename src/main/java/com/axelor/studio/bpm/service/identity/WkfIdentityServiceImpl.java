/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.db.tenants.TenantConfig;
import com.axelor.db.tenants.TenantModule;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.bpm.utils.BpmTools;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.identity.Group;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WkfIdentityServiceImpl implements WkfIdentityService {

  private static final Logger log = LoggerFactory.getLogger(WkfIdentityServiceImpl.class);

  // Fixed Camunda group constants
  protected static final String GROUP_ADMIN = "admin";
  protected static final String GROUP_USER = "user";
  protected static final String GROUP_ADMIN_NAME = "Administrators";
  protected static final String GROUP_USER_NAME = "Users";
  protected static final String GROUP_TYPE_WORKFLOW = "workflow";

  // Validation patterns
  private static final String VALID_USER_CODE_PATTERN = "^[a-zA-Z0-9._-]+$";

  protected ProcessEngineService processEngineService;

  protected WkfIdentitySyncMapper mapper;

  protected WkfModelRepository modelRepository;

  protected UserRepository userRepository;

  @Inject
  public WkfIdentityServiceImpl(
      ProcessEngineService processEngineService,
      WkfIdentitySyncMapper mapper,
      WkfModelRepository modelRepository,
      UserRepository userRepository) {
    this.processEngineService = processEngineService;
    this.mapper = mapper;
    this.modelRepository = modelRepository;
    this.userRepository = userRepository;
  }

  @Override
  @Transactional
  public WkfIdentitySyncReport syncModelIdentities(WkfModel model) throws IllegalStateException {

    WkfIdentitySyncReport report = new WkfIdentitySyncReport();

    try {
      log.info("Starting identity synchronization for model: {}", model.getCode());

      String modelCode = model.getCode();
      if (modelCode == null || modelCode.trim().isEmpty()) {
        throw new IllegalStateException(
            "Model code is required for identity synchronization. Model ID: " + model.getId());
      }

      ProcessEngine engine = processEngineService.getEngine();
      if (engine == null) {
        throw new IllegalStateException("ProcessEngine is not available");
      }

      IdentityService identityService = engine.getIdentityService();

      String tenantId = getTenantId();

      Set<User> allUsers = new HashSet<>();

      Set<User> adminUsers = new HashSet<>();
      if (model.getAdminUserSet() != null && !model.getAdminUserSet().isEmpty()) {
        adminUsers.addAll(model.getAdminUserSet());
      }
      adminUsers.addAll(getUsersFromRoles(model.getAdminRoleSet()));

      Set<User> regularUsers = new HashSet<>();
      if (model.getUserSet() != null && !model.getUserSet().isEmpty()) {
        regularUsers.addAll(model.getUserSet());
      }
      regularUsers.addAll(getUsersFromRoles(model.getRoleSet()));

      allUsers.addAll(adminUsers);
      allUsers.addAll(regularUsers);

      log.info(
          "Found {} users to sync ({} admin, {} user)",
          allUsers.size(),
          adminUsers.size(),
          regularUsers.size());

      if (allUsers.isEmpty()) {
        log.warn("No users to synchronize for model: {}", model.getCode());
        model.setSyncStatus(WkfModelRepository.SYNC_STATUS_SUCCESS);
        model.setSyncLog("No users to synchronize");
        report.complete();
        return report;
      }

      for (User axelorUser : allUsers) {
        syncUser(axelorUser, identityService, tenantId, report);
      }

      createMembershipsForLevel(
          adminUsers, GROUP_ADMIN, identityService, tenantId, modelCode, report);
      createMembershipsForLevel(
          regularUsers, GROUP_USER, identityService, tenantId, modelCode, report);

      cleanupObsoleteMemberships(
          adminUsers, GROUP_ADMIN, identityService, tenantId, modelCode, report);
      cleanupObsoleteMemberships(
          regularUsers, GROUP_USER, identityService, tenantId, modelCode, report);

      report.complete();
      model.setLastSyncDate(LocalDateTime.now());
      model.setSyncStatus(
          report.isSuccess()
              ? WkfModelRepository.SYNC_STATUS_SUCCESS
              : WkfModelRepository.SYNC_STATUS_ERROR);
      model.setSyncLog(buildSyncLog(report));

      log.info("Synchronization completed: {}", report);

    } catch (Exception e) {
      log.error("Critical error during synchronization: {}", e.getMessage(), e);
      model.setSyncStatus(WkfModelRepository.SYNC_STATUS_ERROR);
      model.setSyncLog("Critical error: " + e.getMessage());
      report.addError("Critical error: " + e.getMessage());
      report.complete();
      throw new IllegalStateException("Failed to synchronize identities", e);
    }

    return report;
  }

  @Override
  @Transactional
  public WkfIdentitySyncReport resyncModelIdentities(Long modelId) {
    WkfModel model = modelRepository.find(modelId);
    if (model == null) {
      throw new IllegalArgumentException("Workflow model not found with ID: " + modelId);
    }

    if (model.getStatusSelect() == null
        || model.getStatusSelect() != WkfModelRepository.STATUS_ON_GOING) {
      throw new IllegalArgumentException(
          "Workflow model is not deployed. Deploy it first. Current status: "
              + model.getStatusSelect());
    }

    WkfIdentitySyncReport report = syncModelIdentities(model);

    modelRepository.save(model);

    return report;
  }

  protected Set<User> getUsersFromRoles(Set<Role> roles) {
    Set<User> users = new HashSet<>();
    if (roles != null && !roles.isEmpty()) {
      List<Long> roleIds = roles.stream().map(Role::getId).collect(Collectors.toList());

      List<User> usersWithRoles =
          userRepository
              .all()
              .filter("self.roles.id IN (:roleIds)")
              .bind("roleIds", roleIds)
              .fetch();

      users.addAll(usersWithRoles);
    }
    return users;
  }

  protected void syncUser(
      User axelorUser,
      IdentityService identityService,
      String tenantId,
      WkfIdentitySyncReport report) {

    try {
      // Validate user directly
      String userCode = axelorUser.getCode();

      // Rule 1: Code must not be blank
      if (userCode == null || userCode.trim().isEmpty()) {
        log.warn("User validation failed: code is blank");
        report.addError("User code is blank (required for Camunda user ID)");
        report.incrementUsersErrors();
        return;
      }

      // Rule 2: Code should not contain special characters (Camunda limitation)
      if (!userCode.matches(VALID_USER_CODE_PATTERN)) {
        log.warn("User {} validation failed: invalid characters in code", userCode);
        report.addError(
            "User "
                + userCode
                + " code contains invalid characters. Allowed: letters, numbers, dot, underscore, dash");
        report.incrementUsersErrors();
        return;
      }

      String camundaUserId = mapper.generateUserId(axelorUser, tenantId);

      org.camunda.bpm.engine.identity.User existingUser =
          identityService.createUserQuery().userId(camundaUserId).singleResult();

      boolean isNew = (existingUser == null);

      org.camunda.bpm.engine.identity.User camundaUser =
          mapper.mapAxelorUserToCamunda(axelorUser, camundaUserId, identityService);
      identityService.saveUser(camundaUser);

      if (isNew) {
        report.incrementUsersCreated();
      } else {
        report.incrementUsersUpdated();
      }

    } catch (Exception e) {
      log.error(
          "Error syncing user {} (ID: {}): {}",
          axelorUser.getCode(),
          axelorUser.getId(),
          e.getMessage(),
          e);
      report.addError("User " + axelorUser.getCode() + ": " + e.getMessage());
      report.incrementUsersErrors();
    }
  }

  protected String buildFullGroupId(String groupId, String modelCode, String tenantId) {
    String fullGroupId = groupId + "_" + modelCode;
    if (tenantId != null && !tenantId.isEmpty()) {
      fullGroupId = tenantId + "_" + fullGroupId;
    }
    return fullGroupId;
  }

  protected void createMembershipsForLevel(
      Set<User> users,
      String groupId,
      IdentityService identityService,
      String tenantId,
      String modelCode,
      WkfIdentitySyncReport report) {

    String fullGroupId = buildFullGroupId(groupId, modelCode, tenantId);

    ensureModelGroupExists(identityService, fullGroupId, groupId, tenantId);

    List<String> existingMemberIds =
        identityService.createUserQuery().memberOfGroup(fullGroupId).list().stream()
            .map(org.camunda.bpm.engine.identity.User::getId)
            .collect(Collectors.toList());

    Set<String> existingMembersSet = new HashSet<>(existingMemberIds);

    for (User axelorUser : users) {
      try {
        String camundaUserId = mapper.generateUserId(axelorUser, tenantId);

        if (!existingMembersSet.contains(camundaUserId)) {
          identityService.createMembership(camundaUserId, fullGroupId);
          report.incrementMembershipsCreated();
        }

      } catch (Exception e) {
        log.error(
            "Error creating membership for user {} (ID: {}) to group {}: {}",
            axelorUser.getCode(),
            axelorUser.getId(),
            groupId,
            e.getMessage(),
            e);
        report.addError(
            "Membership " + axelorUser.getCode() + " → " + groupId + ": " + e.getMessage());
        report.incrementMembershipsErrors();
      }
    }
  }

  protected void cleanupObsoleteMemberships(
      Set<User> expectedUsers,
      String groupId,
      IdentityService identityService,
      String tenantId,
      String modelCode,
      WkfIdentitySyncReport report) {

    String fullGroupId = buildFullGroupId(groupId, modelCode, tenantId);

    try {
      List<org.camunda.bpm.engine.identity.User> currentMembers =
          identityService.createUserQuery().memberOfGroup(fullGroupId).list();

      Set<String> expectedUserIds = new HashSet<>();
      for (User axelorUser : expectedUsers) {
        String camundaUserId = mapper.generateUserId(axelorUser, tenantId);
        expectedUserIds.add(camundaUserId);
      }

      for (org.camunda.bpm.engine.identity.User currentMember : currentMembers) {
        String currentUserId = currentMember.getId();

        if (!expectedUserIds.contains(currentUserId)) {
          try {
            identityService.deleteMembership(currentUserId, fullGroupId);
            log.info("Deleted obsolete membership: user {} → group {}", currentUserId, fullGroupId);
            report.incrementMembershipsDeleted();
          } catch (Exception e) {
            log.error(
                "Error deleting membership for user {} from group {}: {}",
                currentUserId,
                fullGroupId,
                e.getMessage(),
                e);
            report.addError(
                "Delete membership " + currentUserId + " → " + fullGroupId + ": " + e.getMessage());
            report.incrementMembershipsErrors();
          }
        }
      }

    } catch (Exception e) {
      log.error("Error cleaning up memberships for group {}: {}", fullGroupId, e.getMessage(), e);
      report.addError("Cleanup memberships for " + fullGroupId + ": " + e.getMessage());
      report.incrementMembershipsErrors();
    }
  }

  protected void ensureModelGroupExists(
      IdentityService identityService, String fullGroupId, String baseGroupId, String tenantId) {

    Group existingGroup = identityService.createGroupQuery().groupId(fullGroupId).singleResult();

    if (existingGroup == null) {
      Group group = identityService.newGroup(fullGroupId);

      String groupName = baseGroupId.equals(GROUP_ADMIN) ? GROUP_ADMIN_NAME : GROUP_USER_NAME;
      group.setName(groupName);
      group.setType(GROUP_TYPE_WORKFLOW);

      identityService.saveGroup(group);
      log.info("Created model-specific Camunda group: {}", fullGroupId);
    }
  }

  protected String getTenantId() {
    if (TenantModule.isEnabled()) {
      String tenantId = BpmTools.getCurrentTenant();
      if (!TenantConfig.DEFAULT_TENANT_ID.equals(tenantId)) {
        return tenantId;
      }
    }
    return null;
  }

  protected String buildSyncLog(WkfIdentitySyncReport report) {
    StringBuilder log = new StringBuilder();
    log.append(String.format("Synchronization completed at %s\n", report.getEndTime()));
    log.append(String.format("Duration: %.2f seconds\n", report.getDuration().toMillis() / 1000.0));
    log.append("\n");
    log.append("Users:\n");
    log.append(String.format("  - Created: %d\n", report.getUsersCreated()));
    log.append(String.format("  - Updated: %d\n", report.getUsersUpdated()));
    log.append(String.format("  - Errors: %d\n", report.getUsersErrors()));
    log.append("\n");
    log.append("Memberships:\n");
    log.append(String.format("  - Created: %d\n", report.getMembershipsCreated()));
    log.append(String.format("  - Deleted: %d\n", report.getMembershipsDeleted()));
    log.append(String.format("  - Errors: %d\n", report.getMembershipsErrors()));

    if (!report.getErrors().isEmpty()) {
      log.append("\n");
      log.append("Errors:\n");
      for (String error : report.getErrors()) {
        log.append("  - ").append(error).append("\n");
      }
    }

    log.append("\n");
    log.append("Status: ").append(report.isSuccess() ? "SUCCESS" : "ERROR");

    return log.toString();
  }
}
