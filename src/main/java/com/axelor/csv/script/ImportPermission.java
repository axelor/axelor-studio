/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.csv.script;

import com.axelor.auth.db.Permission;
import com.axelor.auth.db.Role;
import com.axelor.auth.db.repo.GroupRepository;
import com.axelor.auth.db.repo.PermissionRepository;
import com.axelor.auth.db.repo.RoleRepository;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ImportPermission {

  PermissionRepository permissionRepo;
  GroupRepository groupRepo;
  RoleRepository roleRepo;

  @Inject
  public ImportPermission(
      PermissionRepository permissionRepo, GroupRepository groupRepo, RoleRepository roleRepo) {
    this.permissionRepo = permissionRepo;
    this.groupRepo = groupRepo;
    this.roleRepo = roleRepo;
  }

  @Transactional(rollbackOn = Exception.class)
  public Object importPermission(Object bean, Map<String, Object> values) {
    assert bean instanceof Permission;
    try {

      Permission permission = (Permission) bean;
      String groups = (String) values.get("group");
      if (permission.getId() != null) {
        if (groups != null && !groups.isEmpty()) {
          groupRepo
              .all()
              .filter("code in ?1", Arrays.asList(groups.split("\\|")))
              .fetch()
              .forEach(
                  group -> {
                    Set<Permission> permissions = group.getPermissions();
                    if (permissions == null) {
                      permissions = new HashSet<>();
                    }
                    permissions.add(permissionRepo.find(permission.getId()));
                    group.setPermissions(permissions);
                    groupRepo.save(group);
                  });
        }
      }
      return permission;
    } catch (Exception e) {
      e.printStackTrace();
    }
    return bean;
  }

  @Transactional(rollbackOn = Exception.class)
  public Object importPermissionToRole(Object bean, Map<String, Object> values) {

    assert bean instanceof Permission;

    Permission permission = (Permission) bean;
    String roleName = values.get("roleName").toString();
    if (Strings.isNullOrEmpty(roleName)) {
      return bean;
    }

    Role role = roleRepo.findByName(roleName);

    if (role == null) {
      return bean;
    }

    role.addPermission(permission);
    return bean;
  }
}
