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
package com.axelor.studio.bpm.service.deployment;

import com.axelor.web.socket.Message;
import com.axelor.web.socket.MessageDecoder;
import com.axelor.web.socket.MessageEncoder;
import com.axelor.web.socket.MessageType;
import com.axelor.web.socket.inject.WebSocketConfigurator;
import com.axelor.web.socket.inject.WebSocketSecurity;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import javax.inject.Singleton;
import javax.websocket.CloseReason;
import javax.websocket.EndpointConfig;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
@WebSocketSecurity
@ServerEndpoint(
    value = "/bpm/deploy/progress",
    decoders = MessageDecoder.class,
    encoders = MessageEncoder.class,
    configurator = WebSocketConfigurator.class)
public class BpmDeploymentWebSocket {

  static Map<String, Integer> eventMap = new ConcurrentHashMap<>();
  static Map<String, Session> sessionMap = new ConcurrentHashMap<>();
  private static final Logger log = LoggerFactory.getLogger(BpmDeploymentWebSocket.class);

  @OnOpen
  public void onOpen(Session session, EndpointConfig config) {
    sessionMap.put(getCustomIdFromSession(session), session);
    sendCurrentProgress(session);
  }

  @OnClose
  public void onClose(Session session, CloseReason reason) {
    sessionMap.remove(session.getId());
  }

  @OnMessage
  public void onMessage(Session session, Message message) {
    log.info(message.getType().name());
    sendCurrentProgress(session);
  }

  private void sendCurrentProgress(Session session) {
    try {
      Integer progress = eventMap.getOrDefault(session.getId(), 0);
      HashMap<String, Object> data = new HashMap<>();
      Message message = new Message();
      data.put("progress", progress);
      message.setType(MessageType.MSG);
      message.setData(data);
      session.getBasicRemote().sendObject(message);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private String getCustomIdFromSession(Session session) {
    // Extract custom ID from query parameters
    String queryString = session.getQueryString();
    if (queryString != null) {
      String[] params = queryString.split("&");
      for (String param : params) {
        String[] keyValue = param.split("=");
        if (keyValue.length == 2 && "customId".equals(keyValue[0])) {
          try {
            return URLDecoder.decode(keyValue[1], "UTF-8");
          } catch (UnsupportedEncodingException e) {
            log.warn("Failed to decode custom ID: {}", keyValue[1]);
          }
        }
      }
    }
    return null;
  }

  public static void updateProgress(String sessionId, Integer percentage) {
    eventMap.put(sessionId, percentage);
    Session session = sessionMap.get(sessionId);
    if (session != null && session.isOpen()) {
      try {
        Message message = new Message();
        HashMap<String, Object> data = new HashMap<>();
        data.put("percentage", percentage);
        message.setType(MessageType.MSG);
        message.setData(data);
        session.getBasicRemote().sendObject(message);
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
  }
}
