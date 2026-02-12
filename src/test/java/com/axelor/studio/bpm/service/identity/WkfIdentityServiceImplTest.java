/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.ProcessEngine;
import org.camunda.bpm.engine.identity.Group;
import org.camunda.bpm.engine.identity.GroupQuery;
import org.camunda.bpm.engine.identity.UserQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WkfIdentityServiceImplTest extends BaseTest {

  private final WkfModelRepository wkfModelRepo;
  private final UserRepository userRepository;
  private final LoaderHelper loaderHelper;

  private WkfIdentityServiceImpl service;

  private ProcessEngineService processEngineService;
  private ProcessEngine processEngine;
  private IdentityService identityService;
  private UserQuery userQuery;
  private GroupQuery groupQuery;

  private static final AtomicLong seq = new AtomicLong(1);

  @Inject
  WkfIdentityServiceImplTest(
      WkfModelRepository wkfModelRepo, UserRepository userRepository, LoaderHelper loaderHelper) {
    this.wkfModelRepo = wkfModelRepo;
    this.userRepository = userRepository;
    this.loaderHelper = loaderHelper;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/groups-input.xml");
    loaderHelper.importCsv("data/users-input.xml");

    processEngineService = mock(ProcessEngineService.class);
    processEngine = mock(ProcessEngine.class);
    identityService = mock(IdentityService.class);
    userQuery = mock(UserQuery.class);
    groupQuery = mock(GroupQuery.class);

    when(processEngineService.getEngine()).thenReturn(processEngine);
    when(processEngine.getIdentityService()).thenReturn(identityService);
    when(identityService.createUserQuery()).thenReturn(userQuery);
    when(identityService.createGroupQuery()).thenReturn(groupQuery);

    service =
        new WkfIdentityServiceImpl(
            processEngineService, new WkfIdentitySyncMapper(), wkfModelRepo, userRepository);
  }

  // --- syncModelIdentities tests ---

  @Test
  void shouldThrowWhenModelCodeIsBlank() {
    WkfModel model = new WkfModel();
    model.setCode("");

    assertThrows(IllegalStateException.class, () -> service.syncModelIdentities(model));
  }

  @Test
  void shouldReturnSuccessReportWhenNoUsers() {
    String suffix = String.valueOf(seq.getAndIncrement());
    WkfModel model = new WkfModel();
    model.setCode("empty-model-" + suffix);

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    assertNotNull(report);
    assertTrue(report.isSuccess());
    assertEquals(WkfModelRepository.SYNC_STATUS_SUCCESS, model.getSyncStatus());
    assertEquals("No users to synchronize", model.getSyncLog());
  }

  @Test
  @Transactional
  void shouldSyncAdminAndRegularUsers() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User adminUser = userRepository.findByCode("customize");
    User regularUser = userRepository.findByCode("share");

    WkfModel model = new WkfModel();
    model.setCode("sync-model-" + suffix);
    model.setAdminUserSet(new HashSet<>(Set.of(adminUser)));
    model.setUserSet(new HashSet<>(Set.of(regularUser)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    assertTrue(report.isSuccess());
    assertEquals(2, report.getUsersCreated());
    verify(identityService, times(2)).saveUser(any());
  }

  @Test
  @Transactional
  void shouldCreateModelSpecificGroups() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User user = userRepository.findByCode("customize");

    WkfModel model = new WkfModel();
    model.setCode("groups-model-" + suffix);
    model.setAdminUserSet(new HashSet<>(Set.of(user)));
    model.setUserSet(new HashSet<>(Set.of(user)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    service.syncModelIdentities(model);

    verify(identityService, times(2)).saveGroup(any(Group.class));
  }

  @Test
  @Transactional
  void shouldCreateMembershipsForAdminGroup() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User adminUser = userRepository.findByCode("customize");

    WkfModel model = new WkfModel();
    model.setCode("admin-mbr-" + suffix);
    model.setAdminUserSet(new HashSet<>(Set.of(adminUser)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    verify(identityService).createMembership("customize", "admin_admin-mbr-" + suffix);
    assertTrue(report.getMembershipsCreated() > 0);
  }

  @Test
  @Transactional
  void shouldCreateMembershipsForUserGroup() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User regularUser = userRepository.findByCode("share");

    WkfModel model = new WkfModel();
    model.setCode("user-mbr-" + suffix);
    model.setUserSet(new HashSet<>(Set.of(regularUser)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    verify(identityService).createMembership("share", "user_user-mbr-" + suffix);
    assertTrue(report.getMembershipsCreated() > 0);
  }

  @Test
  @Transactional
  void shouldSkipExistingMemberships() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User user = userRepository.findByCode("customize");
    String modelCode = "skip-mbr-" + suffix;

    WkfModel model = new WkfModel();
    model.setCode(modelCode);
    model.setUserSet(new HashSet<>(Set.of(user)));

    org.camunda.bpm.engine.identity.User existingMember =
        mock(org.camunda.bpm.engine.identity.User.class);
    when(existingMember.getId()).thenReturn("customize");
    setupUserQueryForMembership(List.of(existingMember));
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    verify(identityService, never()).createMembership(eq("customize"), eq("user_" + modelCode));
    assertEquals(0, report.getMembershipsCreated());
  }

  @Test
  @Transactional
  void shouldCleanupObsoleteMemberships() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User currentUser = userRepository.findByCode("customize");
    String modelCode = "cleanup-" + suffix;

    WkfModel model = new WkfModel();
    model.setCode(modelCode);
    model.setUserSet(new HashSet<>(Set.of(currentUser)));

    org.camunda.bpm.engine.identity.User currentMember =
        mock(org.camunda.bpm.engine.identity.User.class);
    when(currentMember.getId()).thenReturn("customize");
    org.camunda.bpm.engine.identity.User obsoleteMember =
        mock(org.camunda.bpm.engine.identity.User.class);
    when(obsoleteMember.getId()).thenReturn("removed_user");

    setupUserQueryForMembership(List.of(currentMember, obsoleteMember));
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    verify(identityService).deleteMembership("removed_user", "user_" + modelCode);
    assertTrue(report.getMembershipsDeleted() > 0);
  }

  @Test
  @Transactional
  void shouldSetSyncStatusSuccessOnCompletion() {
    String suffix = String.valueOf(seq.getAndIncrement());
    User user = userRepository.findByCode("customize");

    WkfModel model = new WkfModel();
    model.setCode("status-ok-" + suffix);
    model.setUserSet(new HashSet<>(Set.of(user)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();
    setupUserSync();

    service.syncModelIdentities(model);

    assertEquals(WkfModelRepository.SYNC_STATUS_SUCCESS, model.getSyncStatus());
    assertNotNull(model.getLastSyncDate());
  }

  @Test
  void shouldSetSyncStatusErrorOnUserValidationFailure() {
    String suffix = String.valueOf(seq.getAndIncrement());

    User invalidUser = new User();
    invalidUser.setCode("");
    invalidUser.setName("Invalid User");

    WkfModel model = new WkfModel();
    model.setCode("status-err-" + suffix);
    model.setAdminUserSet(new HashSet<>(Set.of(invalidUser)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    assertFalse(report.isSuccess());
    assertEquals(WkfModelRepository.SYNC_STATUS_ERROR, model.getSyncStatus());
  }

  @Test
  void shouldRejectUserWithBlankCode() {
    String suffix = String.valueOf(seq.getAndIncrement());

    User blankUser = new User();
    blankUser.setCode(null);
    blankUser.setName("Blank Code");

    WkfModel model = new WkfModel();
    model.setCode("reject-blank-" + suffix);
    model.setUserSet(new HashSet<>(Set.of(blankUser)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    assertFalse(report.isSuccess());
    assertEquals(1, report.getUsersErrors());
  }

  @Test
  void shouldRejectUserWithSpecialCharacters() {
    String suffix = String.valueOf(seq.getAndIncrement());

    User specialUser = new User();
    specialUser.setCode("user name with spaces");
    specialUser.setName("Special User");

    WkfModel model = new WkfModel();
    model.setCode("reject-special-" + suffix);
    model.setUserSet(new HashSet<>(Set.of(specialUser)));

    setupUserQueryForMembership(Collections.emptyList());
    setupGroupQueryReturnsNull();
    setupMockGroupCreation();

    WkfIdentitySyncReport report = service.syncModelIdentities(model);

    assertFalse(report.isSuccess());
    assertEquals(1, report.getUsersErrors());
  }

  // --- resyncModelIdentities tests ---

  @Test
  void shouldThrowWhenModelNotFound() {
    assertThrows(IllegalArgumentException.class, () -> service.resyncModelIdentities(999999L));
  }

  @Test
  @Transactional
  void shouldThrowWhenModelNotDeployed() {
    String suffix = String.valueOf(seq.getAndIncrement());

    WkfModel model = new WkfModel();
    model.setCode("not-deployed-" + suffix);
    model.setStatusSelect(WkfModelRepository.STATUS_NEW);
    model = wkfModelRepo.save(model);
    getEntityManager().flush();

    Long modelId = model.getId();
    assertThrows(IllegalArgumentException.class, () -> service.resyncModelIdentities(modelId));
  }

  // --- getUsersFromRoles tests ---

  @Test
  void shouldReturnEmptySetWhenRolesNull() {
    Set<User> result = service.getUsersFromRoles(null);

    assertTrue(result.isEmpty());
  }

  @Test
  void shouldReturnEmptySetWhenRolesEmpty() {
    Set<User> result = service.getUsersFromRoles(Collections.emptySet());

    assertTrue(result.isEmpty());
  }

  // --- buildFullGroupId tests ---

  @Test
  void shouldBuildGroupIdWithoutTenant() {
    String result = service.buildFullGroupId("admin", "modelCode", null);

    assertEquals("admin_modelCode", result);
  }

  @Test
  void shouldBuildGroupIdWithTenant() {
    String result = service.buildFullGroupId("admin", "modelCode", "t1");

    assertEquals("t1_admin_modelCode", result);
  }

  // --- Helper methods ---

  private void setupUserQueryForMembership(List<org.camunda.bpm.engine.identity.User> members) {
    UserQuery memberQuery = mock(UserQuery.class);
    when(identityService.createUserQuery()).thenReturn(userQuery);
    when(userQuery.memberOfGroup(anyString())).thenReturn(memberQuery);
    when(memberQuery.list()).thenReturn(members);
  }

  private void setupGroupQueryReturnsNull() {
    when(groupQuery.groupId(anyString())).thenReturn(groupQuery);
    when(groupQuery.singleResult()).thenReturn(null);
  }

  private void setupMockGroupCreation() {
    Group mockGroup = mock(Group.class);
    when(identityService.newGroup(anyString())).thenReturn(mockGroup);
  }

  private void setupUserSync() {
    org.camunda.bpm.engine.identity.User mockCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);
    when(userQuery.userId(anyString())).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser(anyString())).thenReturn(mockCamundaUser);
  }
}
