/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

public class MediaTypeFactory {
  public MediaType get(String mediaType) {
    if (mediaType == null) {
      return null;
    }
    return switch (mediaType) {
      case "xml" -> new XmlMediaType();
      case "json" -> new JsonMediaType();
      case "plain" -> new TextMediaType();
      default -> null;
    };
  }
}
