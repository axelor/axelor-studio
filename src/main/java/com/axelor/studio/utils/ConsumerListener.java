package com.axelor.studio.utils;

import com.axelor.data.Listener;
import com.axelor.db.Model;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.function.BiConsumer;
import java.util.function.Consumer;

public final class ConsumerListener implements Listener {

  private final BiConsumer<Integer, Integer> importedConsumer;
  private final Consumer<Model> importedModelConsumer;
  private final BiConsumer<Model, Exception> errorConsumer;

  public ConsumerListener(
      BiConsumer<Integer, Integer> importedConsumer,
      Consumer<Model> importedModelConsumer,
      BiConsumer<Model, Exception> errorConsumer) {
    this.importedConsumer = importedConsumer;
    this.importedModelConsumer = importedModelConsumer;
    this.errorConsumer = errorConsumer;
  }

  @Override
  public void imported(Integer total, Integer success) {
    importedConsumer.accept(total, success);
  }

  @Override
  public void imported(Model bean) {
    importedModelConsumer.accept(bean);
  }

  @Override
  public void handle(Model bean, Exception e) {
    errorConsumer.accept(bean, e);
    ExceptionHelper.trace(e);
  }
}
