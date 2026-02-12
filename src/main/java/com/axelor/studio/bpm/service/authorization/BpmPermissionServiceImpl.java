/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import com.axelor.auth.db.Permission;
import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.PermissionRepository;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.WkfTaskMenu;
import com.axelor.studio.db.WkfTaskMenuContext;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.HashSet;
import java.util.Set;

public class BpmPermissionServiceImpl implements BpmPermissionService {

  private static final String WKF_MODEL_READ_PERM = "perm.wkf.model.__read__";
  private static final String WKF_MODEL_ADMIN_PERM = "perm.wkf.model.__admin__";
  private static final String WKF_INSTANCE_READ_PERM = "perm.wkf.instance.__read__";

  private static final String WKF_PROCESS_ADMIN_PERM = "perm.wkf.process.__admin__";
  private static final String WKF_TASK_CONFIG_ADMIN_PERM = "perm.wkf.task.config.__admin__";
  private static final String WKF_PROCESS_CONFIG_ADMIN_PERM = "perm.wkf.process.config.__admin__";
  private static final String WKF_TASK_MENU_ADMIN_PERM = "perm.wkf.task.menu.__admin__";
  private static final String WKF_TASK_MENU_CONTEXT_ADMIN_PERM =
      "perm.wkf.task.menu.context.__admin__";
  private static final String PERM_BPM_ALL = "perm.bpm.all";

  private final PermissionRepository permissionRepo;

  @Inject
  public BpmPermissionServiceImpl(PermissionRepository permissionRepo) {
    this.permissionRepo = permissionRepo;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void syncPermissions(WkfModel wkfModel) {
    // Core permissions
    Permission modelReadPerm = findOrCreateWkfModelRead();
    Permission modelAdminPerm = findOrCreateWkfModelAdmin();
    Permission instanceReadPerm = findOrCreateWkfInstanceRead();

    // Cascade entity admin permissions (for WkfModel save cascade)
    Permission processAdminPerm = findOrCreateWkfProcessAdmin();
    Permission taskConfigAdminPerm = findOrCreateWkfTaskConfigAdmin();
    Permission processConfigAdminPerm = findOrCreateWkfProcessConfigAdmin();
    Permission taskMenuAdminPerm = findOrCreateWkfTaskMenuAdmin();
    Permission taskMenuContextAdminPerm = findOrCreateWkfTaskMenuContextAdmin();

    // === USERS ===

    // Assign READ permissions to all declared users
    Set<User> allDeclaredUsers = collectAllDeclaredUsers(wkfModel);
    for (User user : allDeclaredUsers) {
      addPermissionIfAbsent(user, modelReadPerm);
      addPermissionIfAbsent(user, instanceReadPerm);
    }

    // Assign ADMIN permissions to admin users (includes cascade entities for save)
    Set<User> adminUsers = collectAdminUsers(wkfModel);
    for (User user : adminUsers) {
      addPermissionIfAbsent(user, modelAdminPerm);
      addPermissionIfAbsent(user, processAdminPerm);
      addPermissionIfAbsent(user, taskConfigAdminPerm);
      addPermissionIfAbsent(user, processConfigAdminPerm);
      addPermissionIfAbsent(user, taskMenuAdminPerm);
      addPermissionIfAbsent(user, taskMenuContextAdminPerm);
    }

    // === ROLES ===

    // Assign READ permissions to all declared roles
    Set<Role> allDeclaredRoles = collectAllDeclaredRoles(wkfModel);
    for (Role role : allDeclaredRoles) {
      addPermissionIfAbsent(role, modelReadPerm);
      addPermissionIfAbsent(role, instanceReadPerm);
    }

    // Assign ADMIN permissions to admin roles (includes cascade entities for save)
    Set<Role> adminRoles = collectAdminRoles(wkfModel);
    for (Role role : adminRoles) {
      addPermissionIfAbsent(role, modelAdminPerm);
      addPermissionIfAbsent(role, processAdminPerm);
      addPermissionIfAbsent(role, taskConfigAdminPerm);
      addPermissionIfAbsent(role, processConfigAdminPerm);
      addPermissionIfAbsent(role, taskMenuAdminPerm);
      addPermissionIfAbsent(role, taskMenuContextAdminPerm);
    }
  }

  private Permission findOrCreateWkfModelRead() {
    Permission perm = permissionRepo.findByName(WKF_MODEL_READ_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_MODEL_READ_PERM);
      perm.setObject(WkfModel.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT m.id FROM WkfModel m \
          LEFT JOIN m.userSet u \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.roleSet r \
          LEFT JOIN m.adminRoleSet ar \
          WHERE u = ? OR au = ? \
          OR r IN (?) OR ar IN (?))""");
      perm.setConditionParams(
          "__user__.isBpmAdministrator, __user__, __user__, __user__.roles, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(false);
      perm.setCanCreate(false);
      perm.setCanRemove(false);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  private Permission findOrCreateWkfModelAdmin() {
    Permission perm = permissionRepo.findByName(WKF_MODEL_ADMIN_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_MODEL_ADMIN_PERM);
      perm.setObject(WkfModel.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT m.id FROM WkfModel m \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.adminRoleSet ar \
          WHERE au = ? OR ar IN (?))""");
      perm.setConditionParams("__user__.isBpmAdministrator, __user__, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  private Permission findOrCreateWkfInstanceRead() {
    Permission perm = permissionRepo.findByName(WKF_INSTANCE_READ_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_INSTANCE_READ_PERM);
      perm.setObject(WkfInstance.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT i.id FROM WkfInstance i \
          JOIN i.wkfProcess p \
          JOIN p.wkfModel m \
          LEFT JOIN m.userSet u \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.roleSet r \
          LEFT JOIN m.adminRoleSet ar \
          WHERE u = ? OR au = ? \
          OR r IN (?) OR ar IN (?))""");
      perm.setConditionParams(
          "__user__.isBpmAdministrator, __user__, __user__, __user__.roles, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(false);
      perm.setCanCreate(false);
      perm.setCanRemove(false);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  // --- WkfProcess (L1 - direct link to WkfModel) ---

  private Permission findOrCreateWkfProcessAdmin() {
    Permission perm = permissionRepo.findByName(WKF_PROCESS_ADMIN_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_PROCESS_ADMIN_PERM);
      perm.setObject(WkfProcess.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT p.id FROM WkfProcess p \
          JOIN p.wkfModel m \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.adminRoleSet ar \
          WHERE au = ? OR ar IN (?))""");
      perm.setConditionParams("__user__.isBpmAdministrator, __user__, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  // --- WkfTaskConfig (L1 - direct link to WkfModel) ---

  private Permission findOrCreateWkfTaskConfigAdmin() {
    Permission perm = permissionRepo.findByName(WKF_TASK_CONFIG_ADMIN_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_TASK_CONFIG_ADMIN_PERM);
      perm.setObject(WkfTaskConfig.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT tc.id FROM WkfTaskConfig tc \
          JOIN tc.wkfModel m \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.adminRoleSet ar \
          WHERE au = ? OR ar IN (?))""");
      perm.setConditionParams("__user__.isBpmAdministrator, __user__, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  // --- WkfProcessConfig (L2 - via WkfProcess → WkfModel) ---

  private Permission findOrCreateWkfProcessConfigAdmin() {
    Permission perm = permissionRepo.findByName(WKF_PROCESS_CONFIG_ADMIN_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_PROCESS_CONFIG_ADMIN_PERM);
      perm.setObject(WkfProcessConfig.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT pc.id FROM WkfProcessConfig pc \
          JOIN pc.wkfProcess p \
          JOIN p.wkfModel m \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.adminRoleSet ar \
          WHERE au = ? OR ar IN (?))""");
      perm.setConditionParams("__user__.isBpmAdministrator, __user__, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  // --- WkfTaskMenu (L2 - via WkfTaskConfig → WkfModel) ---

  private Permission findOrCreateWkfTaskMenuAdmin() {
    Permission perm = permissionRepo.findByName(WKF_TASK_MENU_ADMIN_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_TASK_MENU_ADMIN_PERM);
      perm.setObject(WkfTaskMenu.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT tm.id FROM WkfTaskMenu tm \
          JOIN tm.wkfTaskConfig tc \
          JOIN tc.wkfModel m \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.adminRoleSet ar \
          WHERE au = ? OR ar IN (?))""");
      perm.setConditionParams("__user__.isBpmAdministrator, __user__, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  // --- WkfTaskMenuContext (L3 - via WkfTaskMenu → WkfTaskConfig → WkfModel) ---

  private Permission findOrCreateWkfTaskMenuContextAdmin() {
    Permission perm = permissionRepo.findByName(WKF_TASK_MENU_CONTEXT_ADMIN_PERM);
    if (perm == null) {
      perm = new Permission();
      perm.setName(WKF_TASK_MENU_CONTEXT_ADMIN_PERM);
      perm.setObject(WkfTaskMenuContext.class.getName());
      perm.setCondition(
          """
          ? = true OR self.id = ANY(SELECT tmc.id FROM WkfTaskMenuContext tmc \
          JOIN tmc.wkfTaskMenu tm \
          JOIN tm.wkfTaskConfig tc \
          JOIN tc.wkfModel m \
          LEFT JOIN m.adminUserSet au \
          LEFT JOIN m.adminRoleSet ar \
          WHERE au = ? OR ar IN (?))""");
      perm.setConditionParams("__user__.isBpmAdministrator, __user__, __user__.roles");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }

  private Set<User> collectAllDeclaredUsers(WkfModel wkfModel) {
    Set<User> users = new HashSet<>();
    if (wkfModel.getAdminUserSet() != null) {
      users.addAll(wkfModel.getAdminUserSet());
    }
    if (wkfModel.getUserSet() != null) {
      users.addAll(wkfModel.getUserSet());
    }
    return users;
  }

  private Set<User> collectAdminUsers(WkfModel wkfModel) {
    Set<User> users = new HashSet<>();
    if (wkfModel.getAdminUserSet() != null) {
      users.addAll(wkfModel.getAdminUserSet());
    }
    return users;
  }

  private Set<Role> collectAllDeclaredRoles(WkfModel wkfModel) {
    Set<Role> roles = new HashSet<>();
    if (wkfModel.getAdminRoleSet() != null) {
      roles.addAll(wkfModel.getAdminRoleSet());
    }
    if (wkfModel.getRoleSet() != null) {
      roles.addAll(wkfModel.getRoleSet());
    }
    return roles;
  }

  private Set<Role> collectAdminRoles(WkfModel wkfModel) {
    Set<Role> roles = new HashSet<>();
    if (wkfModel.getAdminRoleSet() != null) {
      roles.addAll(wkfModel.getAdminRoleSet());
    }
    return roles;
  }

  private void addPermissionIfAbsent(User user, Permission permission) {
    if (user.getPermissions() == null || !user.getPermissions().contains(permission)) {
      user.addPermission(permission);
    }
  }

  private void addPermissionIfAbsent(Role role, Permission permission) {
    if (role.getPermissions() == null || !role.getPermissions().contains(permission)) {
      role.addPermission(permission);
    }
  }

  @Override
  public void manageBpmAdminPermission(User user, Boolean isBpmAdministrator) {
    Permission bpmAllPermission = permissionRepo.findByName(PERM_BPM_ALL);
    if (bpmAllPermission == null) {
      return;
    }

    Set<Permission> permissions = user.getPermissions();
    if (permissions == null) {
      permissions = new HashSet<>();
      user.setPermissions(permissions);
    }

    if (Boolean.TRUE.equals(isBpmAdministrator)) {
      if (!permissions.contains(bpmAllPermission)) {
        user.addPermission(bpmAllPermission);
      }
    } else {
      user.removePermission(bpmAllPermission);
    }
  }
}
