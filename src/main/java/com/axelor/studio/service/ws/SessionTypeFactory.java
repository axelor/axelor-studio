/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

public class SessionTypeFactory {
  public SessionType get(String sessionType) {
    if (sessionType == null) {
      return null;
    }
    return switch (sessionType) {
      case "cookie" -> new SessionTypeCookie();
      case "token" -> new SessionTypeToken();
      case "Standard" -> new SessionTypeBasic();
      default -> null;
    };
  }
}
