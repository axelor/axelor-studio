/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.service.ws;

import com.axelor.common.StringUtils;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.MetaFiles;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsKeyValue;
import com.axelor.studio.db.WsKeyValueSelectionHeader;
import com.axelor.studio.db.WsRequest;
import com.axelor.studio.db.WsRequestList;
import com.axelor.studio.service.app.AppStudioService;
import com.axelor.text.GroovyTemplates;
import com.axelor.text.Templates;
import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.google.common.base.Strings;
import com.google.common.net.UrlEscapers;
import com.google.inject.Inject;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.lang.invoke.MethodHandles;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.Invocation.Builder;
import javax.ws.rs.core.Form;
import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.http.client.utils.URIBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WsConnectorServiceImpl implements WsConnectorService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected final SessionTypeFactory sessionTypeFactory;
  protected WsAuthenticatorService wsAuthenticatorService;
  protected GroovyTemplates templates;
  protected SessionType sessionType = null;

  protected final MetaFiles metaFiles;

  @Inject
  public WsConnectorServiceImpl(
      SessionTypeFactory sessionTypeFactory,
      WsAuthenticatorService wsAuthenticatorService,
      GroovyTemplates templates,
      MetaFiles metaFiles) {
    this.sessionTypeFactory = sessionTypeFactory;
    this.wsAuthenticatorService = wsAuthenticatorService;
    this.templates = templates;
    this.metaFiles = metaFiles;
  }

  private void authenticationVerify(
      WsAuthenticator authenticator, Client client, Map<String, Object> ctx) {
    if (authenticator != null && authenticator.getAuthTypeSelect().equals("basic")) {
      WsRequest wsRequest = authenticator.getAuthWsRequest();
      var defaultType =
          authenticator.getUsername() != null && authenticator.getPassword() != null
              ? "Standard"
              : null;
      this.sessionType =
          this.sessionTypeFactory.get(
              wsRequest != null ? authenticator.getResponseType() : defaultType);
      if (wsRequest == null && this.sessionType != null) {
        this.sessionType.extractSessionData(null, authenticator);
      } else if (this.sessionType != null) {
        Response wsResponse = callRequest(wsRequest, wsRequest.getWsUrl(), client, templates, ctx);
        if (wsResponse.getStatus() == 401) {
          throw new IllegalStateException(I18n.get("Error in authorization"));
        } else {
          this.sessionType.extractSessionData(wsResponse, authenticator);
        }
        wsResponse.close();
      }
    }
  }

  @Override
  @SuppressWarnings("unchecked")
  public Map<String, Object> callConnector(
      WsConnector wsConnector, WsAuthenticator authenticator, Map<String, Object> ctx) {

    if (wsConnector == null) {
      return ctx;
    }

    if (authenticator == null) {
      authenticator = wsConnector.getDefaultWsAuthenticator();
    }

    if (ctx == null) {
      ctx = new HashMap<>();
    }

    Client client = ClientBuilder.newClient();

    HashMap<String, Object> resultContext = new HashMap<>();

    ctx.putAll(createContext(wsConnector, authenticator));

    // verify authentication and extract cookies
    authenticationVerify(authenticator, client, ctx);

    String lastRepeatIf = null;
    int repeatRequestCount = 0;
    int count = 1;
    int repeatIndex = 0;

    WsRequest wsRequest = null;

    wsConnector.getWsRequestList().sort(Comparator.comparingInt(WsRequestList::getSequence));

    Boolean enableTrackWebServiceCall =
        Beans.get(AppStudioService.class).getAppStudio().getEnableTrackWebServiceCall();

    while (count < wsConnector.getWsRequestList().size() + 1) {
      Response wsResponse = null;
      try {
        ctx.put("_repeatIndex", repeatIndex);

        if (lastRepeatIf != null
            && !Boolean.parseBoolean(templates.fromText(lastRepeatIf).make(ctx).render())) {
          lastRepeatIf =
              null; // here is a problem here , will skip the next request if the repeat  is false
          count++;
          repeatIndex = 0;
          continue;
        }

        if (!ctx.containsKey("_" + count)) {
          ctx.put("_" + count, null);
        }

        wsRequest = wsConnector.getWsRequestList().get(count - 1).getWsRequest();
        String repeatIf = wsRequest.getRepeatIf();

        String callIf = wsRequest.getCallIf();
        if (callIf != null) {
          callIf = templates.fromText(callIf).make(ctx).render();
          if (!Boolean.parseBoolean(callIf)) {
            count++;
            continue;
          }
        }

        String url = wsConnector.getBaseUrl() + "/" + wsRequest.getWsUrl();

        wsResponse = callRequest(wsRequest, url, client, templates, ctx);

        if (wsResponse.getStatus() == 401) {

          if (authenticator != null && authenticator.getAuthTypeSelect().equals("oauth2")) {
            wsAuthenticatorService.refereshToken(authenticator).close();
            ctx.putAll(createContext(wsConnector, authenticator));
            wsResponse.close();
            wsResponse = callRequest(wsRequest, url, client, templates, ctx);
          }

          if (wsResponse == null || wsResponse.getStatus() == 401) {
            throw new IllegalArgumentException(
                String.format(
                    I18n.get("Error in authorization of connector: %s"), wsConnector.getName()));
          }
        }

        ArrayList<Object> responseData = new ArrayList<>();
        HashMap<String, Object> res = new HashMap<>();
        res.put("response type", wsResponse.getMediaType());
        if ((wsResponse.getMediaType() != null)
            && (new MediaTypeFactory().get(wsResponse.getMediaType().getSubtype()) != null)) {
          MediaType mediaType = new MediaTypeFactory().get(wsResponse.getMediaType().getSubtype());

          if (repeatIndex == 1) {
            responseData.add(ctx.get("_" + count));
            responseData.add(mediaType.parseResponse(wsResponse));
            res.put("body", responseData);
            ctx.put("_" + count, responseData);
            resultContext.put("_" + count, res);
          } else if (repeatIndex != 0) {
            responseData = (ArrayList<Object>) ctx.get("_" + count);
            responseData.add(mediaType.parseResponse(wsResponse));
            res.put("body", responseData);
            ctx.put("_" + count, responseData);
            resultContext.put("_" + count, res);
          } else {
            Object parsedResponse = mediaType.parseResponse(wsResponse);
            res.put("body", parsedResponse);
            ctx.put("_" + count, parsedResponse);
            resultContext.put("_" + count, res);
          }

        } else {
          if (repeatIndex == 1) {
            responseData.add(ctx.get("_" + count));
            ctx.put("_" + count, responseData.add(wsResponse.readEntity(byte[].class)));
            res.put("body", responseData);
            resultContext.put("_" + count, res);
          } else if (repeatIndex != 0) {
            responseData = (ArrayList<Object>) ctx.get("_" + count);
            responseData.add(wsResponse.readEntity(byte[].class));
            res.put("body", responseData);
            ctx.put("_" + count, responseData);
            resultContext.put("_" + count, res);
          } else {
            ctx.put("_" + count, wsResponse.readEntity(byte[].class));
            res.put("body", wsResponse.readEntity(byte[].class));
            resultContext.put("_" + count, res);
          }
        }

        log.debug("Request{}: {} ", count, ctx.get("_" + count));

        if (lastRepeatIf != null
            && (!lastRepeatIf.equals(repeatIf))
            && (Boolean.parseBoolean(templates.fromText(lastRepeatIf).make(ctx).render()))) {
          count = repeatRequestCount;
          repeatIndex++;
        }
        if (lastRepeatIf == null) {
          lastRepeatIf = repeatIf;
          repeatRequestCount = count;
        }
        count++;

        if (count == (wsConnector.getWsRequestList().size() + 1)
            && lastRepeatIf != null
            && (Boolean.parseBoolean(templates.fromText(lastRepeatIf).make(ctx).render()))) {
          count = repeatRequestCount;
          repeatIndex++;
        }
      } catch (Exception e) {
        if (wsRequest != null && enableTrackWebServiceCall) {
          addAttachement(resultContext, wsRequest, wsResponse, wsConnector, e);
        }
        throw new IllegalArgumentException(e.getMessage());
      }
    }
    // success
    if (enableTrackWebServiceCall) {
      addAttachement(resultContext, wsConnector);
    }
    return ctx;
  }

  @Override
  public Response callRequest(
      WsRequest wsRequest,
      String url,
      Client client,
      Templates templates,
      Map<String, Object> ctx) {

    url = templates.fromText(url).make(ctx).render();
    url = UrlEscapers.urlFragmentEscaper().escape(url);

    MultivaluedMap<String, Object> headers = new MultivaluedHashMap<>();
    wsRequest
        .getHeaderWsKeyValueList()
        .forEach(
            wsKeyValue -> {
              if (wsKeyValue.getSubWsKeyValueList() != null
                  && !wsKeyValue.getSubWsKeyValueList().isEmpty()) {
                Map<String, Object> subHeaders = new HashMap<>();
                for (WsKeyValueSelectionHeader key : wsKeyValue.getSubWsKeyValueList()) {
                  subHeaders.put(
                      key.getWsKey(), templates.fromText(key.getWsValue()).make(ctx).render());
                }
                headers.add(wsKeyValue.getWsKey(), subHeaders);
              } else {
                String value = wsKeyValue.getWsValue();
                if (!Strings.isNullOrEmpty(value)) {
                  value = templates.fromText(wsKeyValue.getWsValue()).make(ctx).render();
                  if (!StringUtils.isBlank(value)
                      && value.startsWith("Basic ")
                      && wsKeyValue.getWsKey().equals("Authorization")) {
                    headers.add(
                        wsKeyValue.getWsKey(),
                        "Basic " + new String(Base64.encodeBase64(value.substring(6).getBytes())));
                  } else {
                    headers.add(wsKeyValue.getWsKey(), value);
                  }
                }
              }
            });

    String requestType = wsRequest.getRequestTypeSelect();
    Entity<?> entity = null;
    if (requestType.equals("GET") || requestType.equals("DELETE")) {
      try {
        URIBuilder uriBuilder = new URIBuilder(url);

        for (WsKeyValue wsKeyValue :
            Stream.concat(
                    wsRequest.getPayLoadWsKeyValueList().stream(),
                    wsRequest.getParameterWsKeyValueList().stream())
                .collect(Collectors.toList())) {
          String value = wsKeyValue.getWsValue();
          if (value != null) {
            if (value.startsWith("_encode:")) {
              uriBuilder.addParameter(
                  wsKeyValue.getWsKey(),
                  new String(
                      Base64.encodeBase64(
                          templates
                              .fromText(wsKeyValue.getWsValue())
                              .make(ctx)
                              .render()
                              .getBytes())));
            } else {
              uriBuilder.addParameter(
                  wsKeyValue.getWsKey(),
                  templates.fromText(wsKeyValue.getWsValue()).make(ctx).render());
            }
          }
        }

        url = uriBuilder.toString();
      } catch (URISyntaxException e) {
        ExceptionHelper.trace(e);
      }
    } else {
      entity = createEntity(wsRequest, templates, ctx);
    }

    log.debug("URL: {}", url);

    Builder request = client.target(url).request().headers(headers);
    if (this.sessionType != null) {
      this.sessionType.injectSessionData(request);
    }

    return request.method(wsRequest.getRequestTypeSelect(), entity);
  }

  @Override
  public Map<String, Object> createContext(WsConnector wsConnector, WsAuthenticator authenticator) {

    Map<String, Object> ctx = new HashMap<>();

    if (authenticator == null
        || !authenticator.getAuthTypeSelect().equals("oauth2")
        || !Boolean.TRUE.equals(authenticator.getIsAuthenticated())) {
      return ctx;
    }

    String tokenResponse = authenticator.getTokenResponse();
    if (authenticator.getRefreshTokenResponse() != null) {
      tokenResponse = authenticator.getRefreshTokenResponse();
    }

    if (tokenResponse != null) {
      ObjectMapper mapper = new ObjectMapper();
      try {
        JsonNode jsonNode = mapper.readTree(tokenResponse);
        jsonNode
            .fields()
            .forEachRemaining(
                it ->
                    ctx.put(
                        it.getKey(),
                        (it.getValue().isArray()
                            ? it.getValue().get(0).asText()
                            : it.getValue().asText())));
      } catch (Exception e) {
        ExceptionHelper.trace(e);
        throw new IllegalStateException(e);
      }
    }

    return ctx;
  }

  @Override
  public Entity<?> createEntity(WsRequest wsRequest, Templates templates, Map<String, Object> ctx) {

    String payLoadType = wsRequest.getPayLoadTypeSelect();
    List<WsKeyValue> payLoadList = wsRequest.getPayLoadWsKeyValueList();
    if (payLoadType == null || payLoadList.isEmpty()) {
      return null;
    }

    // order the payload list by sequence
    payLoadList.sort(Comparator.comparingInt(WsKeyValue::getSequence));

    Entity<?> entity = null;
    Object obj = null;
    String key = payLoadList.get(0).getWsKey();
    String value = payLoadList.get(0).getWsValue();
    String text = null;
    if (key.equals("eval")) {
      obj = ctx.get(value);
    } else {
      text = templates.fromText(value).make(ctx).render();
    }

    switch (payLoadType) {
      case "form":
        entity = getFormEntity(wsRequest, templates, ctx);
        break;
      case "json":
        entity = getJsonEntity(wsRequest, templates, ctx);
        break;
      case "xml":
        entity = getXmlEntity(wsRequest, templates, ctx);
        break;
      case "text":
        entity = Entity.text(text);
        break;
      case "file":
        try {
          entity =
              text == null
                  ? null
                  : Entity.entity(
                      new FileInputStream(text),
                      javax.ws.rs.core.MediaType.APPLICATION_OCTET_STREAM);

        } catch (FileNotFoundException e) {
          log.error(e.getMessage(), e);
        }
        break;
      case "file-link":
        try {
          entity =
              text == null
                  ? null
                  : Entity.entity(
                      new URL(text).openStream(),
                      javax.ws.rs.core.MediaType.APPLICATION_OCTET_STREAM);
        } catch (IOException e) {
          log.error(e.getMessage(), e);
        }
        break;
      case "file-text":
        boolean isBase64 = text != null && Base64.isBase64(text.getBytes());
        byte[] bytes;
        if (isBase64) {
          bytes = Base64.decodeBase64(text.getBytes());
        } else {
          bytes = text == null ? null : text.getBytes();
        }
        entity =
            bytes == null
                ? null
                : Entity.entity(
                    new ByteArrayInputStream(bytes),
                    javax.ws.rs.core.MediaType.APPLICATION_OCTET_STREAM);
        break;
      case "stream":
        entity =
            obj == null
                ? null
                : Entity.entity(
                    new ByteArrayInputStream((byte[]) obj),
                    javax.ws.rs.core.MediaType.APPLICATION_OCTET_STREAM);
        break;
      default:
        break;
    }

    return entity;
  }

  protected Entity<Map<String, Object>> getJsonEntity(
      WsRequest wsRequest, Templates templates, Map<String, Object> ctx) {

    Map<String, Object> payLoads = new HashMap<>();

    for (WsKeyValue wsKeyValue : wsRequest.getPayLoadWsKeyValueList()) {
      payLoads.put(wsKeyValue.getWsKey(), createPayload(templates, ctx, wsKeyValue));
    }

    return Entity.json(payLoads);
  }

  protected Entity<String> getXmlEntity(
      WsRequest wsRequest, Templates templates, Map<String, Object> ctx) {

    var wsKeyValues = wsRequest.getPayLoadWsKeyValueList();

    if (wsKeyValues == null) {
      return Entity.xml("");
    }

    if (wsKeyValues.size() > 1) {
      return Entity.xml("");
    }

    var rootName = wsKeyValues.get(0).getWsKey();

    var payload = createPayload(templates, ctx, wsKeyValues.get(0));

    try {
      XmlMapper xmlMapper = new XmlMapper();
      String xml = xmlMapper.writer().withRootName(rootName).writeValueAsString(payload);
      return Entity.xml(xml);
    } catch (JsonProcessingException e) {
      log.error(e.getMessage(), e);
      return Entity.xml("");
    }
  }

  @Override
  public void addAttachement(Map<String, Object> ctx, WsConnector wsConnector) {
    try {
      StringBuilder result = new StringBuilder();
      ctx.entrySet().stream()
          .filter(entry -> entry.getKey().startsWith("_") && !entry.getKey().equals("_beans"))
          .forEach(
              entry -> {
                var key = entry.getKey();
                var value = entry.getValue();
                result.append(key).append(":\n");
                if (value instanceof byte[]) {
                  result.append(new String((byte[]) value)).append("\n\n");
                } else {
                  result.append(value).append("\n\n");
                }
              });
      byte[] bytes = result.toString().getBytes();

      // Create an InputStream from the byte array
      InputStream inputStream = new ByteArrayInputStream(bytes);

      metaFiles.deleteAttachments(wsConnector);
      metaFiles.attach(inputStream, "Log_File", wsConnector);
    } catch (IOException io) {
      ExceptionHelper.trace(io);
    }
  }

  public void addAttachement(
      Map<String, Object> ctx,
      WsRequest wsRequest,
      Response wsResponse,
      WsConnector wsConnector,
      Throwable throwable) {

    try {
      StringBuilder result = new StringBuilder();
      ctx.entrySet().stream()
          .filter(entry -> entry.getKey().startsWith("_") && !entry.getKey().equals("_beans"))
          .forEach(
              entry -> {
                var key = entry.getKey();
                var value = entry.getValue();
                result.append(key).append(":\n");
                if (value instanceof byte[]) {
                  result.append(new String((byte[]) value)).append("\n\n");
                } else {
                  result.append(value).append("\n\n");
                }
              });
      result.append("\nError log : \nConnector : ").append(wsConnector.getName()).append("\n");
      result
          .append("Request " + "( ")
          .append(wsRequest.getName())
          .append(" )")
          .append(" Error : ")
          .append("{")
          .append(throwable.toString())
          .append("}\n");
      if (wsResponse != null) {
        result
            .append("Response type: ")
            .append(wsResponse.getMediaType())
            .append("\n")
            .append("Response Body : ")
            .append(wsResponse.readEntity(Object.class));
      }

      byte[] bytes = result.toString().getBytes();
      // Create an InputStream from the byte array
      InputStream inputStream = new ByteArrayInputStream(bytes);
      metaFiles.deleteAttachments(wsConnector);
      metaFiles.attach(inputStream, "Log_File", wsConnector);
    } catch (IOException io) {
      ExceptionHelper.trace(io);
    }
  }

  protected Object createPayload(
      Templates templates, Map<String, Object> ctx, WsKeyValue wsKeyValue) {
    wsKeyValue.getSubWsKeyValueList().sort(Comparator.comparingInt(WsKeyValue::getSequence));
    Object jsonVal;
    if (wsKeyValue.getWsValue() == null) {
      if (Boolean.TRUE.equals(wsKeyValue.getIsList())) {
        List<Object> subPayLoad = new ArrayList<>();
        for (WsKeyValue subKeyValue : wsKeyValue.getSubWsKeyValueList()) {
          if (subKeyValue.getWsKey() == null && subKeyValue.getWsValue() == null) {
            subPayLoad.add(createPayload(templates, ctx, subKeyValue));
          } else if (subKeyValue.getWsKey() == null) {

            Object jsonSubVal = templates.fromText(subKeyValue.getWsValue()).make(ctx).render();

            if (jsonSubVal != null && jsonSubVal.equals("null")) {
              jsonSubVal = null;
            }
            if (jsonSubVal != null) {
              String val = (String) jsonSubVal;
              if (val.startsWith("[") && val.endsWith("]")) {
                jsonSubVal = val.substring(1, val.length() - 1).trim().split("\\s*,\\s*");
              } else if (NumberUtils.isCreatable(val)) {
                jsonSubVal = NumberUtils.createNumber(val);
              }
            }
            subPayLoad.add(jsonSubVal);
          } else {
            Map<String, Object> subMap = new LinkedHashMap<>();
            subMap.put(subKeyValue.getWsKey(), createPayload(templates, ctx, subKeyValue));
            subPayLoad.add(subMap);
          }
        }
        jsonVal = subPayLoad;
      } else {
        Map<String, Object> subPayLoad = new LinkedHashMap<>();
        for (WsKeyValue subKeyValue : wsKeyValue.getSubWsKeyValueList()) {
          subPayLoad.put(subKeyValue.getWsKey(), createPayload(templates, ctx, subKeyValue));
        }
        jsonVal = subPayLoad;
      }
    } else {
      jsonVal = templates.fromText(wsKeyValue.getWsValue()).make(ctx).render();

      if (jsonVal != null && jsonVal.equals("null")) {
        jsonVal = null;
      }

      if (jsonVal != null) {
        String val = (String) jsonVal;
        if (val.startsWith("[") && val.endsWith("]")) {
          jsonVal = val.substring(1, val.length() - 1).trim().split("\\s*,\\s*");
        } else if (NumberUtils.isCreatable(val)) {
          jsonVal = NumberUtils.createNumber(val);
        }
      }
    }

    return jsonVal;
  }

  protected Entity<Form> getFormEntity(
      WsRequest wsRequest, Templates templates, Map<String, Object> ctx) {

    MultivaluedHashMap<String, String> payLoads = new MultivaluedHashMap<>();
    for (WsKeyValue wsKeyValue : wsRequest.getPayLoadWsKeyValueList()) {
      payLoads.add(
          wsKeyValue.getWsKey(), templates.fromText(wsKeyValue.getWsValue()).make(ctx).render());
    }

    return Entity.form(payLoads);
  }
}
