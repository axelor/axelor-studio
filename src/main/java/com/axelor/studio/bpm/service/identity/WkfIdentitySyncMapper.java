/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.identity;

import com.axelor.auth.db.User;
import org.camunda.bpm.engine.IdentityService;

/** Maps Axelor User entities to Camunda User entities. */
public class WkfIdentitySyncMapper {

  /**
   * Generates a Camunda user ID from an Axelor user.
   *
   * @param user the Axelor user
   * @param tenantId the tenant ID (null for single-tenant)
   * @return the Camunda user ID
   */
  public String generateUserId(User user, String tenantId) {
    String baseUserId = user.getCode();

    if (tenantId != null && !tenantId.isEmpty()) {
      return tenantId + ":" + baseUserId;
    }

    return baseUserId;
  }

  /**
   * Maps an Axelor user to a Camunda user.
   *
   * @param axelorUser the Axelor user
   * @param camundaUserId the target Camunda user ID
   * @param identityService the Camunda IdentityService
   * @return the Camunda user (new or existing)
   */
  public org.camunda.bpm.engine.identity.User mapAxelorUserToCamunda(
      User axelorUser, String camundaUserId, IdentityService identityService) {

    // Check if user already exists in Camunda
    org.camunda.bpm.engine.identity.User camundaUser =
        identityService.createUserQuery().userId(camundaUserId).singleResult();

    boolean isNew = (camundaUser == null);

    if (isNew) {
      camundaUser = identityService.newUser(camundaUserId);
    }

    // Map fields
    String[] names = splitName(axelorUser.getName());
    camundaUser.setFirstName(names[0]);
    camundaUser.setLastName(names[1]);
    camundaUser.setEmail(axelorUser.getEmail());

    if (isNew) {
      camundaUser.setPassword("");
    }

    return camundaUser;
  }

  /**
   * Splits full name into first and last name.
   *
   * @param fullName the full name
   * @return array [firstName, lastName]
   */
  private String[] splitName(String fullName) {
    if (fullName == null || fullName.trim().isEmpty()) {
      return new String[] {"", ""};
    }

    String[] parts = fullName.trim().split("\\s+", 2);
    if (parts.length == 1) {
      return new String[] {parts[0], ""};
    }
    return new String[] {parts[0], parts[1]};
  }
}
