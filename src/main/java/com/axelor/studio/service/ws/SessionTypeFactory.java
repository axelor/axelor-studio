package com.axelor.studio.service.ws;

public class SessionTypeFactory {
  public SessionType get(String sessionType) {
    if (sessionType == null) {
      return null;
    }
    switch (sessionType) {
      case "cookie":
        return new SessionTypeCookie();
      case "token":
        return new SessionTypeToken();
      default:
        return null;
    }
  }
}
