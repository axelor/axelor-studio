package com.axelor.studio.db.repo;

import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.db.tenants.TenantAware;
import com.axelor.inject.Beans;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.listener.WkfRequestListener;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.studio.helper.TransactionHelper;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ServletScopes;
import java.lang.invoke.MethodHandles;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GlobalEntityListener {
  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @PostPersist
  @PostUpdate
  protected void onPostPersistOrUpdate(Model model) {
    Long id = model.getId();
    String className = model.getClass().getName();

    TransactionHelper.runAfterCommit(
        () -> runOnSeparateThread(Set.of(new EntityRef(className, id))));
  }

  protected void runOnSeparateThread(Set<EntityRef> updated) {
    ExecutorService executorService = Executors.newSingleThreadExecutor();
    Callable<Map<String, Object>> callableTask = () -> callWkfProcess(updated);

    Future<?> future =
        executorService.submit(
            () ->
                new TenantAware(
                        () -> {
                          try {
                            callableTask.call();
                          } catch (Exception e) {
                            throw new IllegalStateException(e);
                          }
                        })
                    .withTransaction(false)
                    .tenantId(BpmTools.getCurentTenant())
                    .run());
    try {
      future.get();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    } catch (ExecutionException e) {
      ExceptionHelper.error(e);
    } finally {
      executorService.shutdown();
    }
  }

  protected Map<String, Object> callWkfProcess(Set<EntityRef> updatedRefs)
      throws ClassNotFoundException {

    Map<String, Object> result = new HashMap<>();

    Set<Model> updated = new HashSet<>();
    for (EntityRef ref : updatedRefs) {
      Class<? extends Model> klass = Class.forName(ref.className).asSubclass(Model.class);
      Model model = Query.of(klass).filter("self.id = :id").bind("id", ref.id).fetchOne();
      if (model != null) {
        updated.add(model);
      } else {
        log.warn(
            "Updated entity not found: {} with id={} (possibly deleted)", ref.className, ref.id);
      }
    }

    RequestScoper scope = ServletScopes.scopeRequest(Collections.emptyMap());
    try (RequestScoper.CloseableScope ignored = scope.open()) {
      Beans.get(WkfRequestListener.class)
          .applyProcessChange(
              updated, Collections.emptySet(), WkfInstanceServiceImpl.EXECUTION_SOURCE_LISTENER);
    } catch (ConcurrentModificationException e) {
      ExceptionHelper.error(e);
    }

    result.put("updated", updated);
    result.put("deleted", Collections.emptySet());
    return result;
  }

  public static class EntityRef {
    String className;
    Long id;

    EntityRef(String className, Long id) {
      this.className = className;
      this.id = id;
    }
  }
}
