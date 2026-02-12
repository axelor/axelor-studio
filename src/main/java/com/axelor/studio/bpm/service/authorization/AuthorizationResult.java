/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.authorization;

import java.io.Serializable;

public class AuthorizationResult implements Serializable {

  private static final long serialVersionUID = 1L;

  private final boolean admin;
  private final boolean user;

  public AuthorizationResult(boolean admin, boolean user) {
    this.admin = admin;
    this.user = user;
  }

  public boolean canModifyModel() {
    return admin;
  }

  public boolean canTriggerProcess() {
    return admin || user;
  }

  public boolean canViewStatus() {
    return admin || user;
  }

  public boolean isAdmin() {
    return admin;
  }

  public boolean isUser() {
    return user;
  }

  @Override
  public String toString() {
    return String.format("AuthorizationResult{admin=%s, user=%s}", admin, user);
  }
}
