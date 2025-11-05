package com.axelor.studio.helper;

import com.axelor.db.JPA;
import java.lang.invoke.MethodHandles;
import java.util.concurrent.Callable;
import javax.transaction.Status;
import javax.transaction.Synchronization;
import org.hibernate.Session;
import org.hibernate.engine.spi.SessionImplementor;
import org.hibernate.resource.transaction.spi.SynchronizationRegistry;
import org.hibernate.resource.transaction.spi.TransactionCoordinator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TransactionHelper {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static <T> T runInTransaction(boolean txnStartExtraCondition, Callable<T> callable) {
    var txn = JPA.em().getTransaction();
    var txnStarted = false;
    try {
      if (!txn.isActive() && txnStartExtraCondition) {
        txn.begin();
        txnStarted = true;
      }
      var result = callable.call();
      if (txnStarted && txn.isActive() && !txn.getRollbackOnly()) txn.commit();
      return result;
    } catch (Exception e) {
      if (txnStarted && txn.isActive()) txn.rollback();
      throw new IllegalStateException(e);
    } finally {
      if (txnStarted && txn.isActive()) txn.rollback();
    }
  }

  /** Execute an action after the successful commit of the current transaction. */
  public static void runAfterCommit(Runnable action) {
    if (action == null) {
      throw new IllegalArgumentException("Action cannot be null");
    }

    try {
      Session session = JPA.em().unwrap(Session.class);
      SessionImplementor impl = (SessionImplementor) session;

      TransactionCoordinator tc = impl.getTransactionCoordinator();

      if (!tc.isActive()) {
        throw new IllegalStateException("No active transaction to register a post-commit action");
      }

      SynchronizationRegistry syncRegistry = tc.getLocalSynchronizations();

      syncRegistry.registerSynchronization(new PostCommitSynchronization(action));

    } catch (Exception e) {
      throw new RuntimeException("Unable to register the post-commit action", e);
    }
  }

  /** Implementation of Synchronization to execute actions after commit */
  private static class PostCommitSynchronization implements Synchronization {

    private final Runnable action;

    public PostCommitSynchronization(Runnable action) {
      this.action = action;
    }

    @Override
    public void beforeCompletion() {}

    @Override
    public void afterCompletion(int status) {
      if (status == Status.STATUS_COMMITTED) {
        try {
          action.run();
        } catch (Exception e) {
          log.error("Error executing the post-commit action", e);
        }
      }
    }
  }
}
