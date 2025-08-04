package org.camunda.bpm.engine.impl.variable.serializer;

import org.camunda.bpm.engine.ProcessEngineException;
import org.camunda.bpm.engine.impl.context.Context;
import org.camunda.bpm.engine.variable.Variables;
import org.camunda.bpm.engine.variable.impl.value.UntypedValueImpl;
import org.camunda.bpm.engine.variable.type.ValueType;
import org.camunda.bpm.engine.variable.value.ObjectValue;
import org.camunda.bpm.engine.variable.value.TypedValue;

public class JPAVariableSerializer extends AbstractTypedValueSerializer<ObjectValue> {

  public static final String NAME = "jpa";

  private JPAEntityMappings mappings;

  public JPAVariableSerializer() {
    super(ValueType.OBJECT);
    mappings = new JPAEntityMappings();
  }

  public String getName() {
    return NAME;
  }

  protected boolean canWriteValue(TypedValue value) {
    if (isDeserializedObjectValue(value) || value instanceof UntypedValueImpl) {
      return value.getValue() == null || mappings.isJPAEntity(value.getValue());
    } else {
      return false;
    }
  }

  protected boolean isDeserializedObjectValue(TypedValue value) {
    return value instanceof ObjectValue && ((ObjectValue) value).isDeserialized();
  }

  public ObjectValue convertToTypedValue(UntypedValueImpl untypedValue) {
    return Variables.objectValue(untypedValue.getValue(), untypedValue.isTransient()).create();
  }

  public void writeValue(ObjectValue objectValue, ValueFields valueFields) {
    EntityManagerSession entityManagerSession =
        Context.getCommandContext().getSession(EntityManagerSession.class);
    if (entityManagerSession == null) {
      throw new ProcessEngineException(
          "Cannot set JPA variable: " + EntityManagerSession.class + " not configured");
    } else {
      // Before we set the value we must flush all pending changes from the entitymanager
      // If we don't do this, in some cases the primary key will not yet be set in the object
      // which will cause exceptions down the road.
      entityManagerSession.flush();
    }

    Object value = objectValue.getValue();
    if (value != null) {
      String className = mappings.getJPAClassString(value);
      String idString = mappings.getJPAIdString(value);
      valueFields.setTextValue(className);
      valueFields.setTextValue2(idString);
    } else {
      valueFields.setTextValue(null);
      valueFields.setTextValue2(null);
    }
  }

  public ObjectValue readValue(
      ValueFields valueFields, boolean deserializeObjectValue, boolean asTransientValue) {
    if (valueFields.getTextValue() != null && valueFields.getTextValue2() != null) {
      Object jpaEntity =
          mappings.getJPAEntity(valueFields.getTextValue(), valueFields.getTextValue2());
      return Variables.objectValue(jpaEntity).setTransient(asTransientValue).create();
    }
    return Variables.objectValue(null).setTransient(asTransientValue).create();
  }
}
