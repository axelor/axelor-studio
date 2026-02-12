/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.auth.db.Permission;
import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.PermissionRepository;
import com.axelor.auth.db.repo.RoleRepository;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.studio.db.WkfModel;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BpmPermissionServiceImplTest extends BaseTest {

  private final BpmPermissionService service;
  private final PermissionRepository permissionRepo;
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final LoaderHelper loaderHelper;

  private static final AtomicLong seq = new AtomicLong(1);

  @Inject
  BpmPermissionServiceImplTest(
      BpmPermissionService service,
      PermissionRepository permissionRepo,
      UserRepository userRepository,
      RoleRepository roleRepository,
      LoaderHelper loaderHelper) {
    this.service = service;
    this.permissionRepo = permissionRepo;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.loaderHelper = loaderHelper;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/groups-input.xml");
    loaderHelper.importCsv("data/users-input.xml");
  }

  // --- syncPermissions tests ---

  @Test
  @Transactional
  void shouldCreateAllPermissionsOnFirstSync() {
    User adminUser = userRepository.findByCode("customize");
    User regularUser = userRepository.findByCode("share");

    WkfModel model = new WkfModel();
    model.setCode("test");
    model.setAdminUserSet(new HashSet<>(Set.of(adminUser)));
    model.setUserSet(new HashSet<>(Set.of(regularUser)));

    service.syncPermissions(model);
    getEntityManager().flush();

    assertNotNull(permissionRepo.findByName("perm.wkf.model.__read__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.model.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.instance.__read__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.process.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.task.config.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.process.config.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.task.menu.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.task.menu.context.__admin__"));
  }

  @Test
  @Transactional
  void shouldAssignReadPermissionsToAllDeclaredUsers() {
    User adminUser = userRepository.findByCode("customize");
    User regularUser = userRepository.findByCode("share");

    WkfModel model = new WkfModel();
    model.setCode("test");
    model.setAdminUserSet(new HashSet<>(Set.of(adminUser)));
    model.setUserSet(new HashSet<>(Set.of(regularUser)));

    service.syncPermissions(model);
    getEntityManager().flush();

    assertTrue(
        adminUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__read__".equals(p.getName())));
    assertTrue(
        regularUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__read__".equals(p.getName())));
    assertTrue(
        adminUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.instance.__read__".equals(p.getName())));
    assertTrue(
        regularUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.instance.__read__".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldAssignAdminPermissionsOnlyToAdminUsers() {
    User adminUser = userRepository.findByCode("customize");
    User regularUser = userRepository.findByCode("share");

    WkfModel model = new WkfModel();
    model.setCode("test");
    model.setAdminUserSet(new HashSet<>(Set.of(adminUser)));
    model.setUserSet(new HashSet<>(Set.of(regularUser)));

    service.syncPermissions(model);
    getEntityManager().flush();

    assertTrue(
        adminUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__admin__".equals(p.getName())));
    assertTrue(
        adminUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.process.__admin__".equals(p.getName())));

    assertFalse(
        regularUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__admin__".equals(p.getName())));
    assertFalse(
        regularUser.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.process.__admin__".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldAssignReadPermissionsToAllDeclaredRoles() {
    String suffix = String.valueOf(seq.getAndIncrement());

    Role adminRole = new Role();
    adminRole.setName("admin-role-read-" + suffix);
    roleRepository.save(adminRole);

    Role userRole = new Role();
    userRole.setName("user-role-read-" + suffix);
    roleRepository.save(userRole);

    WkfModel model = new WkfModel();
    model.setCode("test");
    model.setAdminRoleSet(new HashSet<>(Set.of(adminRole)));
    model.setRoleSet(new HashSet<>(Set.of(userRole)));

    service.syncPermissions(model);
    getEntityManager().flush();

    assertTrue(
        adminRole.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__read__".equals(p.getName())));
    assertTrue(
        userRole.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__read__".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldAssignAdminPermissionsOnlyToAdminRoles() {
    String suffix = String.valueOf(seq.getAndIncrement());

    Role adminRole = new Role();
    adminRole.setName("admin-role-admin-" + suffix);
    roleRepository.save(adminRole);

    Role userRole = new Role();
    userRole.setName("user-role-admin-" + suffix);
    roleRepository.save(userRole);

    WkfModel model = new WkfModel();
    model.setCode("test");
    model.setAdminRoleSet(new HashSet<>(Set.of(adminRole)));
    model.setRoleSet(new HashSet<>(Set.of(userRole)));

    service.syncPermissions(model);
    getEntityManager().flush();

    assertTrue(
        adminRole.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__admin__".equals(p.getName())));

    assertFalse(
        userRole.getPermissions().stream()
            .anyMatch(p -> "perm.wkf.model.__admin__".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldNotDuplicatePermissionsOnReSync() {
    User adminUser = userRepository.findByCode("customize");

    WkfModel model = new WkfModel();
    model.setCode("test");
    model.setAdminUserSet(new HashSet<>(Set.of(adminUser)));

    service.syncPermissions(model);
    getEntityManager().flush();
    int firstSyncPermCount = adminUser.getPermissions().size();

    service.syncPermissions(model);
    getEntityManager().flush();
    int secondSyncPermCount = adminUser.getPermissions().size();

    assertEquals(firstSyncPermCount, secondSyncPermCount);
  }

  @Test
  @Transactional
  void shouldHandleEmptyUserAndRoleSets() {
    WkfModel model = new WkfModel();
    model.setCode("test");

    service.syncPermissions(model);
    getEntityManager().flush();

    assertNotNull(permissionRepo.findByName("perm.wkf.model.__read__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.model.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.instance.__read__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.process.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.task.config.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.process.config.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.task.menu.__admin__"));
    assertNotNull(permissionRepo.findByName("perm.wkf.task.menu.context.__admin__"));
  }

  // --- manageBpmAdminPermission tests ---

  @Test
  @Transactional
  void shouldAddBpmAllPermissionWhenAdminToggled() {
    User user = userRepository.findByCode("customize");

    Permission bpmAllPerm = findOrCreateBpmAllPermission();
    getEntityManager().flush();

    service.manageBpmAdminPermission(user, true);

    assertTrue(user.getPermissions().stream().anyMatch(p -> "perm.bpm.all".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldRemoveBpmAllPermissionWhenAdminUntoggled() {
    User user = userRepository.findByCode("customize");

    Permission bpmAllPerm = findOrCreateBpmAllPermission();
    getEntityManager().flush();

    user.addPermission(bpmAllPerm);

    service.manageBpmAdminPermission(user, false);

    assertFalse(user.getPermissions().stream().anyMatch(p -> "perm.bpm.all".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldDoNothingWhenPermissionNotFound() {
    // Ensure perm.bpm.all does not exist in DB
    Permission existing = permissionRepo.findByName("perm.bpm.all");
    if (existing != null) {
      userRepository.all().fetch().forEach(u -> u.removePermission(existing));
      permissionRepo.remove(existing);
      getEntityManager().flush();
    }

    User user = userRepository.findByCode("share");
    assertFalse(
        user.getPermissions() != null
            && user.getPermissions().stream().anyMatch(p -> "perm.bpm.all".equals(p.getName())));

    service.manageBpmAdminPermission(user, true);

    assertFalse(
        user.getPermissions() != null
            && user.getPermissions().stream().anyMatch(p -> "perm.bpm.all".equals(p.getName())));
  }

  @Test
  @Transactional
  void shouldNotDuplicatePermissionOnMultipleToggles() {
    User user = userRepository.findByCode("customize");

    findOrCreateBpmAllPermission();
    getEntityManager().flush();

    service.manageBpmAdminPermission(user, true);
    service.manageBpmAdminPermission(user, true);

    long count =
        user.getPermissions().stream().filter(p -> "perm.bpm.all".equals(p.getName())).count();
    assertEquals(1, count);
  }

  // --- Helper methods ---

  private Permission findOrCreateBpmAllPermission() {
    Permission perm = permissionRepo.findByName("perm.bpm.all");
    if (perm == null) {
      perm = new Permission();
      perm.setName("perm.bpm.all");
      perm.setObject("com.axelor.studio.db.WkfModel");
      perm.setCanRead(true);
      perm.setCanWrite(true);
      perm.setCanCreate(true);
      perm.setCanRemove(true);
      perm = permissionRepo.save(perm);
    }
    return perm;
  }
}
