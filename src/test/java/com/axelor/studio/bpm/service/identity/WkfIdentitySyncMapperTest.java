/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.auth.db.User;
import com.axelor.utils.junit.BaseTest;
import org.camunda.bpm.engine.IdentityService;
import org.camunda.bpm.engine.identity.UserQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WkfIdentitySyncMapperTest extends BaseTest {

  private WkfIdentitySyncMapper mapper;
  private IdentityService identityService;
  private UserQuery userQuery;

  @BeforeEach
  void setUp() {
    mapper = new WkfIdentitySyncMapper();
    identityService = mock(IdentityService.class);
    userQuery = mock(UserQuery.class);
    when(identityService.createUserQuery()).thenReturn(userQuery);
  }

  // --- generateUserId tests ---

  @Test
  void shouldReturnUserCodeWhenNoTenant() {
    User user = new User();
    user.setCode("userCode");

    String result = mapper.generateUserId(user, null);

    assertEquals("userCode", result);
  }

  @Test
  void shouldReturnUserCodeWhenEmptyTenant() {
    User user = new User();
    user.setCode("userCode");

    String result = mapper.generateUserId(user, "");

    assertEquals("userCode", result);
  }

  @Test
  void shouldPrefixTenantIdWhenPresent() {
    User user = new User();
    user.setCode("userCode");

    String result = mapper.generateUserId(user, "tenant1");

    assertEquals("tenant1:userCode", result);
  }

  // --- mapAxelorUserToCamunda tests ---

  @Test
  void shouldCreateNewCamundaUserWhenNotExists() {
    User axelorUser = createAxelorUser("john", "John Doe", "john@test.com");
    org.camunda.bpm.engine.identity.User newCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser("john")).thenReturn(newCamundaUser);

    org.camunda.bpm.engine.identity.User result =
        mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    assertNotNull(result);
    verify(identityService).newUser("john");
    verify(newCamundaUser).setFirstName("John");
    verify(newCamundaUser).setLastName("Doe");
    verify(newCamundaUser).setEmail("john@test.com");
    verify(newCamundaUser).setPassword("");
  }

  @Test
  void shouldUpdateExistingCamundaUserWhenExists() {
    User axelorUser = createAxelorUser("john", "John Doe", "john@test.com");
    org.camunda.bpm.engine.identity.User existingCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(existingCamundaUser);

    org.camunda.bpm.engine.identity.User result =
        mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    assertNotNull(result);
    verify(identityService, never()).newUser("john");
    verify(existingCamundaUser).setFirstName("John");
    verify(existingCamundaUser).setLastName("Doe");
    verify(existingCamundaUser).setEmail("john@test.com");
  }

  @Test
  void shouldSplitFullNameIntoFirstAndLast() {
    User axelorUser = createAxelorUser("john", "John Doe", null);
    org.camunda.bpm.engine.identity.User newCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser("john")).thenReturn(newCamundaUser);

    mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    verify(newCamundaUser).setFirstName("John");
    verify(newCamundaUser).setLastName("Doe");
  }

  @Test
  void shouldHandleSingleNamePart() {
    User axelorUser = createAxelorUser("john", "John", null);
    org.camunda.bpm.engine.identity.User newCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser("john")).thenReturn(newCamundaUser);

    mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    verify(newCamundaUser).setFirstName("John");
    verify(newCamundaUser).setLastName("");
  }

  @Test
  void shouldHandleNullName() {
    User axelorUser = createAxelorUser("john", null, null);
    org.camunda.bpm.engine.identity.User newCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser("john")).thenReturn(newCamundaUser);

    mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    verify(newCamundaUser).setFirstName("");
    verify(newCamundaUser).setLastName("");
  }

  @Test
  void shouldSetEmptyPasswordForNewUsers() {
    User axelorUser = createAxelorUser("john", "John", null);
    org.camunda.bpm.engine.identity.User newCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser("john")).thenReturn(newCamundaUser);

    mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    verify(newCamundaUser).setPassword("");
  }

  @Test
  void shouldNotOverwritePasswordForExistingUsers() {
    User axelorUser = createAxelorUser("john", "John", null);
    org.camunda.bpm.engine.identity.User existingCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(existingCamundaUser);

    mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    verify(existingCamundaUser, never()).setPassword(anyString());
  }

  @Test
  void shouldMapEmailCorrectly() {
    User axelorUser = createAxelorUser("john", "John", "john@example.com");
    org.camunda.bpm.engine.identity.User newCamundaUser =
        mock(org.camunda.bpm.engine.identity.User.class);

    when(userQuery.userId("john")).thenReturn(userQuery);
    when(userQuery.singleResult()).thenReturn(null);
    when(identityService.newUser("john")).thenReturn(newCamundaUser);

    mapper.mapAxelorUserToCamunda(axelorUser, "john", identityService);

    verify(newCamundaUser).setEmail("john@example.com");
  }

  private User createAxelorUser(String code, String name, String email) {
    User user = new User();
    user.setCode(code);
    user.setName(name);
    user.setEmail(email);
    return user;
  }
}
