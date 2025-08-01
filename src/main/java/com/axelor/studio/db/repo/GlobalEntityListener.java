package com.axelor.studio.db.repo;

import com.axelor.db.Model;
import com.axelor.db.tenants.TenantAware;
import com.axelor.inject.Beans;
import com.axelor.studio.baml.tools.BpmTools;
import com.axelor.studio.bpm.listener.WkfRequestListener;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ServletScopes;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;
import java.util.Collections;
import java.util.ConcurrentModificationException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class GlobalEntityListener {
  @PostPersist
  @PostUpdate
  protected void onPostPersistOrUpdate(Model model) {
    runOnSeparateThread(Set.of(model), Set.of());
  }

  protected void runOnSeparateThread(Set<Model> updated, Set<Model> deleted) {
    ExecutorService executorService = Executors.newSingleThreadExecutor();
    Callable<Map<String, Object>> callableTask = () -> callWkfProcess(updated, deleted);

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

  protected Map<String, Object> callWkfProcess(Set<Model> updated, Set<Model> deleted)
      throws ClassNotFoundException {

    Map<String, Object> result = new HashMap<>();
    result.put("updated", updated);
    result.put("deleted", deleted);
    RequestScoper scope = ServletScopes.scopeRequest(Collections.emptyMap());
    try (RequestScoper.CloseableScope ignored = scope.open()) {
      Beans.get(WkfRequestListener.class)
          .applyProcessChange(updated, deleted, WkfInstanceServiceImpl.EXECUTION_SOURCE_LISTENER);
    } catch (ConcurrentModificationException e) {
      ExceptionHelper.error(e);
    }
    return result;
  }
}
