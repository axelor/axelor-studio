/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.axelor.utils.junit.BaseTest;
import org.junit.jupiter.api.Test;

class AuthorizationResultTest extends BaseTest {

  @Test
  void shouldGrantAllCapabilitiesWhenAdmin() {
    AuthorizationResult result = new AuthorizationResult(true, false);

    assertTrue(result.canModifyModel());
    assertTrue(result.canTriggerProcess());
    assertTrue(result.canViewStatus());
    assertTrue(result.isAdmin());
    assertFalse(result.isUser());
  }

  @Test
  void shouldGrantTriggerAndViewButNotModifyWhenUser() {
    AuthorizationResult result = new AuthorizationResult(false, true);

    assertFalse(result.canModifyModel());
    assertTrue(result.canTriggerProcess());
    assertTrue(result.canViewStatus());
    assertFalse(result.isAdmin());
    assertTrue(result.isUser());
  }

  @Test
  void shouldGrantAllCapabilitiesWhenBothAdminAndUser() {
    AuthorizationResult result = new AuthorizationResult(true, true);

    assertTrue(result.canModifyModel());
    assertTrue(result.canTriggerProcess());
    assertTrue(result.canViewStatus());
    assertTrue(result.isAdmin());
    assertTrue(result.isUser());
  }

  @Test
  void shouldDenyAllCapabilitiesWhenNeitherAdminNorUser() {
    AuthorizationResult result = new AuthorizationResult(false, false);

    assertFalse(result.canModifyModel());
    assertFalse(result.canTriggerProcess());
    assertFalse(result.canViewStatus());
    assertFalse(result.isAdmin());
    assertFalse(result.isUser());
  }
}
