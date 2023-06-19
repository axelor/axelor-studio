package com.axelor.studio.service.ws;

public class MediaTypeFactory {
  public MediaType get(String mediaType) {
    if (mediaType == null) {
      return null;
    }
    switch (mediaType) {
      case "xml":
        return new XmlMediaType();
      case "json":
        return new JsonMediaType();
      case "plain":
        return new TextMediaType();
      default:
        return null;
    }
  }
}
