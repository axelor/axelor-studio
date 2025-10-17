/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.ls.builtin;

import com.axelor.studio.ls.annotation.LinkScriptFunction;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpClient.Version;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublisher;
import java.net.http.HttpRequest.Builder;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LinkScriptRequest implements Builder {
  private static final Logger LOG = LoggerFactory.getLogger(LinkScriptRequest.class);
  private final Builder delegate = HttpRequest.newBuilder();

  private LinkScriptRequest() {}

  @LinkScriptFunction("request")
  public static LinkScriptRequest request(String url) {
    return new LinkScriptRequest().url(url);
  }

  public LinkScriptRequest url(String url) {
    return uri(URI.create(url));
  }

  public LinkScriptRequest get() {
    return GET();
  }

  public LinkScriptRequest post(String body) {
    return POST(ofString(body));
  }

  public LinkScriptRequest put(String body) {
    return PUT(ofString(body));
  }

  public LinkScriptRequest delete() {
    return DELETE();
  }

  public LinkScriptRequest method(String method, String body) {
    return method(method, ofString(body));
  }

  public HttpResponse<String> send() {
    try {
      return HttpClient.newHttpClient().send(build(), HttpResponse.BodyHandlers.ofString());
    } catch (Exception e) {
      LOG.error(e.getMessage(), e);
      return null;
    }
  }

  private BodyPublisher ofString(String body) {
    return StringUtils.isBlank(body)
        ? HttpRequest.BodyPublishers.noBody()
        : HttpRequest.BodyPublishers.ofString(body);
  }

  // --- Delegate methods ---

  @Override
  public LinkScriptRequest uri(URI uri) {
    delegate.uri(uri);
    return this;
  }

  @Override
  public LinkScriptRequest expectContinue(boolean enable) {
    delegate.expectContinue(enable);
    return this;
  }

  @Override
  public LinkScriptRequest version(Version version) {
    delegate.version(version);
    return this;
  }

  @Override
  public LinkScriptRequest header(String name, String value) {
    delegate.header(name, value);
    return this;
  }

  @Override
  public LinkScriptRequest headers(String... headers) {
    delegate.headers(headers);
    return this;
  }

  @Override
  public LinkScriptRequest timeout(Duration duration) {
    delegate.timeout(duration);
    return this;
  }

  @Override
  public LinkScriptRequest setHeader(String name, String value) {
    delegate.setHeader(name, value);
    return this;
  }

  @Override
  public LinkScriptRequest GET() {
    delegate.GET();
    return this;
  }

  @Override
  public LinkScriptRequest POST(BodyPublisher bodyPublisher) {
    delegate.POST(bodyPublisher);
    return this;
  }

  @Override
  public LinkScriptRequest PUT(BodyPublisher bodyPublisher) {
    delegate.PUT(bodyPublisher);
    return this;
  }

  @Override
  public LinkScriptRequest DELETE() {
    delegate.DELETE();
    return this;
  }

  @Override
  public LinkScriptRequest method(String method, BodyPublisher bodyPublisher) {
    delegate.method(method, bodyPublisher);
    return this;
  }

  @Override
  public HttpRequest build() {
    return delegate.build();
  }

  @Override
  public LinkScriptRequest copy() {
    delegate.copy();
    return this;
  }
}
