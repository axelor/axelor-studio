package com.axelor.studio.db.repo;

import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.db.tenants.TenantAware;
import com.axelor.inject.Beans;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.listener.WkfRequestListener;
import com.axelor.studio.bpm.service.BpmAsyncExecutorService;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.studio.bpm.service.init.ProcessEngineService;
import com.axelor.studio.helper.TransactionHelper;
import com.axelor.studio.service.AppSettingsStudioService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ScopingException;
import com.google.inject.servlet.ServletScopes;
import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.atomic.AtomicReference;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GlobalEntityListener {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  static final ThreadLocal<Integer> BPM_DEPTH = ThreadLocal.withInitial(() -> 0);

  @PostPersist
  @PostUpdate
  protected void onPostPersistOrUpdate(Model model) {
    // Skip if BPM process engine is not initialized (BPM app not active)
    if (!Beans.get(ProcessEngineService.class).isInitialized()) {
      return;
    }

    int maxDepth = Beans.get(AppSettingsStudioService.class).bpmMaxReentranceDepth();
    if (BPM_DEPTH.get() >= maxDepth) {
      log.warn(
          "BPM max reentrance depth ({}) reached, skipping {} id={}",
          maxDepth,
          model.getClass().getName(),
          model.getId());
      return;
    }

    Long id = model.getId();
    String className = model.getClass().getName();

    TransactionHelper.runAfterCommit(() -> runOnSeparateThread(new EntityRef(className, id)));
  }

  protected void runOnSeparateThread(EntityRef updated) {
    var latch = new CountDownLatch(1);
    var error = new AtomicReference<Throwable>();
    int callerDepth = BPM_DEPTH.get();

    if (callerDepth > 0) {
      log.info("BPM reentrance depth: {} for {}", callerDepth + 1, updated);
    }

    Beans.get(BpmAsyncExecutorService.class)
        .submit(
            () ->
                new TenantAware(
                        () -> {
                          BPM_DEPTH.set(callerDepth + 1);
                          try {
                            callWkfProcess(updated);
                          } catch (Exception e) {
                            error.set(e);
                          } finally {
                            BPM_DEPTH.remove();
                            latch.countDown();
                          }
                        })
                    .withTransaction(false)
                    .tenantId(BpmTools.getCurentTenant())
                    .run());
    try {
      // Use ManagedBlocker + CountDownLatch instead of future.get() to:
      // 1. Prevent work-stealing (tryRemoveAndExec) which would execute the task
      //    inline on the same thread, corrupting Hibernate's SynchronizationRegistry
      // 2. Signal to the ForkJoinPool that we're blocking so it creates a
      //    compensating thread (needed when parallelism=1)
      ForkJoinPool.managedBlock(
          new ForkJoinPool.ManagedBlocker() {
            public boolean block() throws InterruptedException {
              latch.await();
              return true;
            }

            public boolean isReleasable() {
              return latch.getCount() == 0;
            }
          });
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
    if (error.get() != null) {
      ExceptionHelper.error(error.get());
    }
  }

  protected void callWkfProcess(EntityRef updatedRef) throws ClassNotFoundException {

    Set<Model> updated = new HashSet<>();
    Class<? extends Model> klass = Class.forName(updatedRef.className).asSubclass(Model.class);
    Model model = Query.of(klass).filter("self.id = :id").bind("id", updatedRef.id).fetchOne();
    if (model != null) {
      updated.add(model);
    } else {
      log.warn(
          "Updated entity not found: {} with id={} (possibly deleted)",
          updatedRef.className,
          updatedRef.id);
    }

    // Try to open a new RequestScope; if one is already active on this thread
    // (ForkJoinPool work-stealing reentrance), proceed without opening a new one
    try {
      RequestScoper scope = ServletScopes.scopeRequest(Collections.emptyMap());
      try (RequestScoper.CloseableScope ignored = scope.open()) {
        applyProcessChange(updated);
      }
    } catch (ScopingException e) {
      // Already in a request scope (work-stealing executed on same thread)
      applyProcessChange(updated);
    }
  }

  private void applyProcessChange(Set<Model> updated) throws ClassNotFoundException {
    try {
      Beans.get(WkfRequestListener.class)
          .applyProcessChange(
              updated, Collections.emptySet(), WkfInstanceServiceImpl.EXECUTION_SOURCE_LISTENER);
    } catch (ConcurrentModificationException e) {
      ExceptionHelper.error(e);
    }
  }

  public static final class EntityRef {

    private final String className;
    private final Long id;

    public EntityRef(String className, Long id) {
      this.className = className;
      this.id = id;
    }

    public String getClassName() {
      return className;
    }

    public Long getId() {
      return id;
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (!(o instanceof EntityRef)) return false;
      EntityRef that = (EntityRef) o;
      return java.util.Objects.equals(className, that.className)
          && java.util.Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
      return java.util.Objects.hash(className, id);
    }

    @Override
    public String toString() {
      return "EntityRef{" + "className='" + className + '\'' + ", id=" + id + '}';
    }
  }
}
