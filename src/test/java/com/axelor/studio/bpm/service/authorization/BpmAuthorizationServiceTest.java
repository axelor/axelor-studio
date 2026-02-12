/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.loader.LoaderHelper;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfProcess;
import com.axelor.studio.db.WkfProcessConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WkfProcessConfigRepository;
import com.axelor.team.db.TeamTask;
import com.axelor.utils.junit.BaseTest;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BpmAuthorizationServiceTest extends BaseTest {

  private final BpmAuthorizationService service;
  private final WkfInstanceRepository wkfInstanceRepo;
  private final WkfModelRepository wkfModelRepo;
  private final WkfProcessConfigRepository wkfProcessConfigRepo;
  private final MetaModelRepository metaModelRepo;
  private final UserRepository userRepository;
  private final LoaderHelper loaderHelper;

  private static final AtomicLong modelIdSeq = new AtomicLong(1000);
  private static final AtomicLong userIdSeq = new AtomicLong(1000);

  @Inject
  BpmAuthorizationServiceTest(
      BpmAuthorizationService service,
      WkfInstanceRepository wkfInstanceRepo,
      WkfModelRepository wkfModelRepo,
      WkfProcessConfigRepository wkfProcessConfigRepo,
      MetaModelRepository metaModelRepo,
      UserRepository userRepository,
      LoaderHelper loaderHelper) {
    this.service = service;
    this.wkfInstanceRepo = wkfInstanceRepo;
    this.wkfModelRepo = wkfModelRepo;
    this.wkfProcessConfigRepo = wkfProcessConfigRepo;
    this.metaModelRepo = metaModelRepo;
    this.userRepository = userRepository;
    this.loaderHelper = loaderHelper;
  }

  @BeforeEach
  void setUp() {
    loaderHelper.importCsv("data/groups-input.xml");
    loaderHelper.importCsv("data/users-input.xml");
    loaderHelper.importCsv("data/meta-model-input.xml");
  }

  // --- canUserTriggerProcess tests ---

  @Test
  void shouldReturnFalseWhenUserIsNull() {
    WkfModel model = createWkfModel("null-user-model");

    assertFalse(service.canUserTriggerProcess(null, model));
  }

  @Test
  void shouldReturnFalseWhenModelIsNull() {
    User user = createUser("user-null-model");

    assertFalse(service.canUserTriggerProcess(user, null));
  }

  @Test
  void shouldReturnTrueWhenUserIsBpmAdministrator() {
    User user = createUser("admin-bpm");
    user.setIsBpmAdministrator(true);
    WkfModel model = createWkfModel("admin-bpm-model");

    assertTrue(service.canUserTriggerProcess(user, model));
  }

  @Test
  void shouldReturnTrueWhenUserInAdminUserSet() {
    User user = createUser("admin-user-set");
    WkfModel model = createWkfModel("admin-user-set-model");
    model.setAdminUserSet(new HashSet<>(Set.of(user)));

    assertTrue(service.canUserTriggerProcess(user, model));
  }

  @Test
  void shouldReturnTrueWhenUserInRegularUserSet() {
    User user = createUser("regular-user-set");
    WkfModel model = createWkfModel("regular-user-set-model");
    model.setUserSet(new HashSet<>(Set.of(user)));

    assertTrue(service.canUserTriggerProcess(user, model));
  }

  @Test
  void shouldReturnTrueWhenUserRoleInAdminRoleSet() {
    Role role = createRole("admin-role-set");
    User user = createUser("admin-role-user");
    user.setRoles(new HashSet<>(Set.of(role)));
    WkfModel model = createWkfModel("admin-role-model");
    model.setAdminRoleSet(new HashSet<>(Set.of(role)));

    assertTrue(service.canUserTriggerProcess(user, model));
  }

  @Test
  void shouldReturnTrueWhenUserRoleInRegularRoleSet() {
    Role role = createRole("user-role-set");
    User user = createUser("user-role-user");
    user.setRoles(new HashSet<>(Set.of(role)));
    WkfModel model = createWkfModel("user-role-model");
    model.setRoleSet(new HashSet<>(Set.of(role)));

    assertTrue(service.canUserTriggerProcess(user, model));
  }

  @Test
  void shouldReturnFalseWhenUserNotInAnySet() {
    User user = createUser("no-set-user");
    WkfModel model = createWkfModel("no-set-model");

    assertFalse(service.canUserTriggerProcess(user, model));
  }

  // --- filterWkfStatus tests ---

  @Test
  void shouldReturnEmptyListWhenUserIsNullForFilter() {
    TeamTask record = new TeamTask();
    List<Map<String, Object>> statusList = List.of(Map.of("name", "status1"));

    List<Map<String, Object>> result = service.filterWkfStatus(null, record, statusList);

    assertTrue(result.isEmpty());
  }

  @Test
  void shouldReturnEmptyListWhenRecordIsNull() {
    User user = createUser("null-record-user");
    List<Map<String, Object>> statusList = List.of(Map.of("name", "status1"));

    List<Map<String, Object>> result = service.filterWkfStatus(user, null, statusList);

    assertTrue(result.isEmpty());
  }

  @Test
  void shouldReturnEmptyListWhenStatusListIsEmpty() {
    User user = createUser("empty-status-user");
    TeamTask record = new TeamTask();

    List<Map<String, Object>> result =
        service.filterWkfStatus(user, record, Collections.emptyList());

    assertTrue(result.isEmpty());
  }

  @Test
  void shouldReturnFullStatusWhenBpmAdministrator() {
    User user = createUser("bpm-admin-filter");
    user.setIsBpmAdministrator(true);
    TeamTask record = new TeamTask();
    List<Map<String, Object>> statusList = createStatusList("status1", "status2");

    List<Map<String, Object>> result = service.filterWkfStatus(user, record, statusList);

    assertEquals(2, result.size());
  }

  @Test
  @Transactional
  void shouldReturnFullStatusWhenModelNotResolved() {
    User user = userRepository.findByCode("customize");
    assertNotNull(user);
    List<Map<String, Object>> statusList = createStatusList("status1");

    List<Map<String, Object>> result = service.filterWkfStatus(user, user, statusList);

    assertEquals(1, result.size());
  }

  @Test
  @Transactional
  void shouldReturnFullStatusWhenUserIsAuthorized() {
    User user = userRepository.findByCode("customize");
    assertNotNull(user);

    WkfModel model = new WkfModel();
    model.setCode("auth-filter-model");
    model.setStatusSelect(WkfModelRepository.STATUS_ON_GOING);
    model.setIsActive(true);
    model.setUserSet(new HashSet<>(Set.of(user)));

    WkfProcess process = new WkfProcess();
    process.setName("auth-filter-process");
    process.setWkfModel(model);
    model.setWkfProcessList(new ArrayList<>(List.of(process)));

    wkfModelRepo.save(model);

    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("proc-authorized");
    instance.setWkfProcess(process);
    wkfInstanceRepo.save(instance);

    TeamTask task = new TeamTask();
    task.setName("auth-filter-task");
    task.setProcessInstanceId("proc-authorized");

    List<Map<String, Object>> statusList = createStatusList("status1", "status2");

    getEntityManager().flush();

    List<Map<String, Object>> result = service.filterWkfStatus(user, task, statusList);

    assertEquals(2, result.size());
  }

  @Test
  @Transactional
  void shouldReturnEmptyListWhenUserNotAuthorized() {
    User user = userRepository.findByCode("customize");
    assertNotNull(user);

    WkfModel model = new WkfModel();
    model.setCode("unauth-filter-model");
    model.setStatusSelect(WkfModelRepository.STATUS_ON_GOING);
    model.setIsActive(true);

    WkfProcess process = new WkfProcess();
    process.setName("unauth-filter-process");
    process.setWkfModel(model);
    model.setWkfProcessList(new ArrayList<>(List.of(process)));

    wkfModelRepo.save(model);

    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("proc-unauthorized");
    instance.setWkfProcess(process);
    wkfInstanceRepo.save(instance);

    TeamTask task = new TeamTask();
    task.setName("unauth-filter-task");
    task.setProcessInstanceId("proc-unauthorized");

    List<Map<String, Object>> statusList = createStatusList("status1");

    getEntityManager().flush();

    List<Map<String, Object>> result = service.filterWkfStatus(user, task, statusList);

    assertTrue(result.isEmpty());
  }

  // --- computeAuthorization caching tests ---

  @Test
  void shouldCacheComputationResults() {
    User user = createUser("cache-user");
    WkfModel model = createWkfModel("cache-model");
    model.setAdminUserSet(new HashSet<>(Set.of(user)));

    AuthorizationResult first = service.computeAuthorization(user, model);
    AuthorizationResult second = service.computeAuthorization(user, model);

    assertSame(first, second);
  }

  @Test
  void shouldInvalidateCacheForModel() {
    User user = createUser("invalidate-user");
    WkfModel model = createWkfModel("invalidate-model");
    model.setAdminUserSet(new HashSet<>(Set.of(user)));

    AuthorizationResult first = service.computeAuthorization(user, model);
    service.invalidateCache(model);
    AuthorizationResult second = service.computeAuthorization(user, model);

    assertNotNull(first);
    assertNotNull(second);
    assertTrue(first != second);
  }

  // --- resolveWkfModelForRecord tests ---

  @Test
  @Transactional
  void shouldResolveViaProcessInstanceId() {
    WkfModel model = new WkfModel();
    model.setCode("resolve-pid-model");
    model.setStatusSelect(WkfModelRepository.STATUS_ON_GOING);
    model.setIsActive(true);

    WkfProcess process = new WkfProcess();
    process.setName("resolve-pid-process");
    process.setWkfModel(model);
    model.setWkfProcessList(new ArrayList<>(List.of(process)));

    wkfModelRepo.save(model);

    WkfInstance instance = new WkfInstance();
    instance.setInstanceId("proc-resolve");
    instance.setWkfProcess(process);
    wkfInstanceRepo.save(instance);

    getEntityManager().flush();

    TeamTask task = new TeamTask();
    task.setProcessInstanceId("proc-resolve");

    WkfModel result = service.resolveWkfModelForRecord(task);

    assertNotNull(result);
    assertEquals(model.getId(), result.getId());
  }

  @Test
  @Transactional
  void shouldResolveViaProcessConfig() {
    WkfModel model = new WkfModel();
    model.setCode("resolve-config-model");
    model.setStatusSelect(WkfModelRepository.STATUS_ON_GOING);
    model.setIsActive(true);

    WkfProcess process = new WkfProcess();
    process.setName("resolve-config-process");
    process.setWkfModel(model);
    model.setWkfProcessList(new ArrayList<>(List.of(process)));

    wkfModelRepo.save(model);

    WkfProcessConfig config = new WkfProcessConfig();
    config.setWkfProcess(process);
    config.setMetaModel(metaModelRepo.findByName("TeamTask"));
    config.setIsStartModel(true);
    wkfProcessConfigRepo.save(config);

    getEntityManager().flush();

    TeamTask task = new TeamTask();
    task.setName("resolve-config-task");

    WkfModel result = service.resolveWkfModelForRecord(task);

    assertNotNull(result);
    assertEquals(model.getId(), result.getId());
  }

  @Test
  @Transactional
  void shouldReturnNullWhenNoResolutionPath() {
    User user = userRepository.findByCode("customize");
    assertNotNull(user);

    WkfModel result = service.resolveWkfModelForRecord(user);

    assertNull(result);
  }

  @Test
  void shouldReturnNullWhenRecordIsNull() {
    WkfModel result = service.resolveWkfModelForRecord(null);

    assertNull(result);
  }

  // --- Helper methods ---

  private User createUser(String code) {
    User user = new User();
    user.setId(userIdSeq.getAndIncrement());
    user.setCode(code);
    return user;
  }

  private Role createRole(String name) {
    Role role = new Role();
    role.setName(name);
    return role;
  }

  private WkfModel createWkfModel(String code) {
    WkfModel model = new WkfModel();
    model.setId(modelIdSeq.getAndIncrement());
    model.setCode(code);
    return model;
  }

  private List<Map<String, Object>> createStatusList(String... names) {
    List<Map<String, Object>> list = new ArrayList<>();
    for (String name : names) {
      Map<String, Object> status = new HashMap<>();
      status.put("name", name);
      list.add(status);
    }
    return list;
  }
}
