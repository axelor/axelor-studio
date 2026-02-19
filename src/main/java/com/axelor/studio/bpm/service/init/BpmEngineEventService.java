/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.init;

import com.axelor.cache.CacheConfig;
import com.axelor.cache.CacheProviderInfo;
import com.axelor.cache.CacheType;
import com.axelor.cache.DistributedFactory;
import com.axelor.cache.redisson.RedissonProvider;
import com.axelor.concurrent.ContextAware;
import com.axelor.inject.Beans;
import com.google.inject.Singleton;
import java.lang.invoke.MethodHandles;
import java.net.InetAddress;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import org.redisson.api.RTopic;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Synchronizes BPM engine state across instances via Redis pub/sub.
 *
 * <p>When the BPM app is installed/uninstalled on one instance, this service publishes an event via
 * Redis {@link RTopic}. All other instances receive the event immediately and start/stop their
 * local engines accordingly.
 *
 * <p>Falls back gracefully for single-instance deployments (no Redis): pub/sub is simply not
 * started, and only local handling occurs.
 */
@Singleton
public class BpmEngineEventService {

  private static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());
  private static final String TOPIC_NAME = "bpm-engine-state";

  private volatile RTopic topic;
  private volatile Integer listenerId;
  private volatile boolean running = false;
  private volatile String instanceId;

  private ExecutorService executor;

  /** Start subscribing to BPM state change events via Redis pub/sub. */
  public synchronized void start() {
    if (running) {
      return;
    }

    if (!isDistributed()) {
      log.info("Non-distributed cache, skipping BPM event subscription");
      return;
    }

    this.instanceId = generateInstanceId();

    RedissonClient redisson = RedissonProvider.get();
    topic = redisson.getTopic(TOPIC_NAME);

    this.executor =
        Executors.newSingleThreadExecutor(
            r -> {
              Thread t = new Thread(r, "BpmEngineEventHandler");
              t.setDaemon(true);
              return t;
            });

    listenerId =
        topic.addListener(
            BpmEngineStateMessage.class,
            (channel, message) -> executor.submit(() -> handleStateChange(message)));

    running = true;
    log.info("BPM engine event service started (Redis pub/sub), instanceId={}", instanceId);
  }

  /** Publish BPM app state change to all instances. */
  public void publishStateChange(String tenantId, boolean active) {
    Objects.requireNonNull(tenantId, "tenantId must not be null");
    if (!running || topic == null) {
      return;
    }
    topic.publish(new BpmEngineStateMessage(tenantId, active, instanceId));
    log.debug("Published BPM state change: tenantId={}, active={}", tenantId, active);
  }

  /** Handle incoming state change from another instance. */
  protected void handleStateChange(BpmEngineStateMessage message) {
    if (instanceId.equals(message.getSourceInstanceId())) {
      return;
    }

    String tenantId = message.getTenantId();
    if (tenantId == null) {
      log.warn("Received BPM state change with null tenantId, ignoring");
      return;
    }
    boolean active = message.isActive();

    log.info(
        "Received BPM state change from another instance: tenantId={}, active={}",
        tenantId,
        active);

    Lock lock = DistributedFactory.getLockIfDistributed("bpm-engine-" + tenantId);
    lock.lock();
    try {
      ContextAware.of()
          .withTenantId(tenantId)
          .withTransaction(false)
          .build(
              () -> {
                BpmEngineInitializer initializer = Beans.get(BpmEngineInitializer.class);
                if (active) {
                  initializer.initializeIfNeeded(tenantId);
                } else {
                  initializer.shutdownIfNeeded(tenantId);
                }
              })
          .run();
    } catch (Exception e) {
      log.error("Error handling BPM state change for tenant: {}", tenantId, e);
    } finally {
      lock.unlock();
    }
  }

  protected boolean isDistributed() {
    return CacheConfig.getAppCacheProvider()
        .flatMap(CacheProviderInfo::getCacheType)
        .map(CacheType::isDistributed)
        .orElse(false);
  }

  protected String generateInstanceId() {
    try {
      return InetAddress.getLocalHost().getHostName()
          + ":pid-"
          + ProcessHandle.current().pid()
          + ":"
          + System.currentTimeMillis();
    } catch (Exception e) {
      return "instance-" + UUID.randomUUID();
    }
  }

  /** Stop subscribing and shut down the executor. */
  public synchronized void stop() {
    if (!running) {
      return;
    }
    if (topic != null && listenerId != null) {
      topic.removeListener(listenerId);
    }
    if (executor != null) {
      executor.shutdown();
      try {
        if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
          log.warn("BPM engine event executor did not terminate within 5 seconds");
          executor.shutdownNow();
        }
      } catch (InterruptedException e) {
        executor.shutdownNow();
        Thread.currentThread().interrupt();
      }
    }
    running = false;
    log.info("BPM engine event service stopped");
  }
}
