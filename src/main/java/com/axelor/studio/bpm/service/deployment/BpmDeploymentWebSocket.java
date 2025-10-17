/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.deployment;

import com.axelor.web.socket.Message;
import com.axelor.web.socket.MessageDecoder;
import com.axelor.web.socket.MessageEncoder;
import com.axelor.web.socket.MessageType;
import com.axelor.web.socket.inject.WebSocketConfigurator;
import com.axelor.web.socket.inject.WebSocketSecurity;
import com.google.inject.Singleton;
import jakarta.websocket.CloseReason;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
    sessionMap.put(session.getId(), session);
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
