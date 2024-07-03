package com.axelor.studio.db.repo;

import com.axelor.db.Model;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.listener.WkfRequestListener;
import com.axelor.studio.bpm.service.execution.WkfInstanceServiceImpl;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.inject.servlet.RequestScoper;
import com.google.inject.servlet.ServletScopes;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.Future;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;

public class GlobalEntityListener {
  @PostPersist
  @PostUpdate
  protected void onPostPersist(Model model) throws InterruptedException {
    runOnForkJoinPool(Set.of(model), Set.of());
  }

  protected void runOnForkJoinPool(Set<Model> updated, Set<Model> deleted) {
    ForkJoinPool forkJoinPool = new ForkJoinPool();
    Callable<Map<String, Object>> callableTask = () -> callWkfProcess(updated, deleted);
    Future<Map<String, Object>> future = forkJoinPool.submit(callableTask);
    try {
      Map<String, Object> result = future.get();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    } catch (ExecutionException e) {
      ExceptionHelper.trace(e);
    } finally {
      forkJoinPool.shutdown();
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
    }
    return result;
  }
}
