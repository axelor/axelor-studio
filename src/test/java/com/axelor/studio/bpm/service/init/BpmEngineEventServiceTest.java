/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.axelor.cache.DistributedFactory;
import com.axelor.cache.redisson.RedissonProvider;
import com.axelor.concurrent.ContextAware;
import com.axelor.concurrent.ContextAwareRunnable;
import com.axelor.inject.Beans;
import java.util.concurrent.locks.Lock;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;

class BpmEngineEventServiceTest {

  @Test
  void start_shouldNotCreateExecutor_whenNotDistributed() throws Exception {
    BpmEngineEventService service = spy(new BpmEngineEventService());
    doReturn(false).when(service).isDistributed();

    service.start();

    assertNull(getField(service, "executor"));
  }

  @Test
  void stop_shouldNotFail_whenExecutorIsNull() throws Exception {
    BpmEngineEventService service = new BpmEngineEventService();
    setField(service, "running", true);

    assertDoesNotThrow(service::stop);
  }

  @Test
  void start_shouldCreateExecutor_whenDistributed() throws Exception {
    BpmEngineEventService service = spy(new BpmEngineEventService());
    doReturn(true).when(service).isDistributed();
    doReturn("test-instance").when(service).generateInstanceId();

    try (MockedStatic<RedissonProvider> redissonProviderMock = mockStatic(RedissonProvider.class)) {
      RedissonClient redissonClient = mock(RedissonClient.class);
      RTopic topic = mock(RTopic.class);

      redissonProviderMock.when(RedissonProvider::get).thenReturn(redissonClient);
      when(redissonClient.getTopic("bpm-engine-state")).thenReturn(topic);
      when(topic.addListener(eq(BpmEngineStateMessage.class), any())).thenReturn(1);

      service.start();

      assertNotNull(getField(service, "executor"));
    } finally {
      service.stop();
    }
  }

  @Test
  void publishStateChange_shouldThrowNPE_whenTenantIdIsNull() {
    BpmEngineEventService service = new BpmEngineEventService();

    assertThrows(NullPointerException.class, () -> service.publishStateChange(null, true));
  }

  @Test
  void publishStateChange_shouldNotPublish_whenNotRunning() {
    BpmEngineEventService service = new BpmEngineEventService();

    assertDoesNotThrow(() -> service.publishStateChange("tenant", true));
  }


  @Test
  void handleStateChange_shouldIgnore_whenTenantIdIsNull() throws Exception {
    BpmEngineEventService service = new BpmEngineEventService();
    setField(service, "instanceId", "test");

    try (MockedStatic<DistributedFactory> dfMock = mockStatic(DistributedFactory.class)) {
      service.handleStateChange(new BpmEngineStateMessage(null, true, "other"));

      dfMock.verifyNoInteractions();
    }
  }

  @Test
  void handleStateChange_shouldIgnore_whenSameInstance() throws Exception {
    BpmEngineEventService service = new BpmEngineEventService();
    setField(service, "instanceId", "test");

    try (MockedStatic<DistributedFactory> dfMock = mockStatic(DistributedFactory.class)) {
      service.handleStateChange(new BpmEngineStateMessage("tenant1", true, "test"));

      dfMock.verifyNoInteractions();
    }
  }


  @Test
  void handleStateChange_shouldCallInitializer_whenActiveFromDifferentInstance() throws Exception {
    BpmEngineEventService service = new BpmEngineEventService();
    setField(service, "instanceId", "local-instance");

    Lock mockLock = mock(Lock.class);
    BpmEngineInitializer mockInitializer = mock(BpmEngineInitializer.class);

    try (MockedStatic<DistributedFactory> dfMock = mockStatic(DistributedFactory.class);
        MockedStatic<ContextAware> caMock = mockStatic(ContextAware.class);
        MockedStatic<Beans> beansMock = mockStatic(Beans.class)) {

      dfMock
          .when(() -> DistributedFactory.getLockIfDistributed("bpm-engine-tenant1"))
          .thenReturn(mockLock);

      // Capture the Runnable passed to build() and execute it immediately via the mock
      ContextAware mockBuilder = mock(ContextAware.class);
      caMock.when(ContextAware::of).thenReturn(mockBuilder);
      when(mockBuilder.withTenantId("tenant1")).thenReturn(mockBuilder);
      when(mockBuilder.withTransaction(false)).thenReturn(mockBuilder);

      ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
      ContextAwareRunnable mockContextRunnable = mock(ContextAwareRunnable.class);
      when(mockBuilder.build(runnableCaptor.capture())).thenReturn(mockContextRunnable);

      beansMock.when(() -> Beans.get(BpmEngineInitializer.class)).thenReturn(mockInitializer);

      service.handleStateChange(new BpmEngineStateMessage("tenant1", true, "remote-instance"));

      // Execute the captured runnable (the lambda inside build())
      runnableCaptor.getValue().run();

      verify(mockInitializer).initializeIfNeeded("tenant1");
      verify(mockLock).lock();
      verify(mockLock).unlock();
    }
  }


  private void setField(Object target, String name, Object value) throws Exception {
    var field = target.getClass().getDeclaredField(name);
    field.setAccessible(true);
    field.set(target, value);
  }

  private Object getField(Object target, String name) throws Exception {
    var field = target.getClass().getDeclaredField(name);
    field.setAccessible(true);
    return field.get(target);
  }

}
