# Expression Engine Alternatives to Context Providers

## Current Implementation Analysis

The current solution uses React Context Providers to propagate calculated values between expressions:

```typescript
CalculatedValuesProvider -> ExpressionWithCalculatedContextProvider -> withExpression HOC
```

This creates a complex dependency chain where:
1. `CalculatedValuesProvider` stores calculated values in a ref
2. `ExpressionWithCalculatedContextProvider` merges calculated values into expression context
3. `withExpression` HOC sets calculated values and reads from context

## Alternative Approaches

### 1. **Direct State Management in FormRenderer**

**Approach**: Store calculated values directly in the FormRenderer component state and pass them down as props.

```typescript
// FormRenderer.tsx
const [calculatedValues, setCalculatedValues] = useState<Record<string, any>>({});

const updateCalculatedValue = (fieldId: string, value: any) => {
  setCalculatedValues(prev => ({ ...prev, [fieldId]: value }));
};

// Pass to all field components
<FieldComponent 
  calculatedValues={calculatedValues}
  updateCalculatedValue={updateCalculatedValue}
  // ... other props
/>
```

**Pros**:
- Simpler architecture, no context providers
- Direct prop passing, easier to debug
- No context re-render issues
- Clear data flow

**Cons**:
- Prop drilling through all field components
- FormRenderer becomes more complex
- Need to pass props to every field component

### 2. **Expression Engine Service with Internal State**

**Approach**: Move calculated value storage into the ExpressionEngineService itself.

```typescript
class ExpressionEngineService {
  private calculatedValues: Map<string, any> = new Map();
  
  setCalculatedValue(fieldId: string, value: any) {
    this.calculatedValues.set(fieldId, value);
  }
  
  getCalculatedValue(fieldId: string) {
    return this.calculatedValues.get(fieldId);
  }
  
  evaluate(expression: string, context: FormContext) {
    // Merge calculated values into context before evaluation
    const enhancedContext = { ...context };
    this.calculatedValues.forEach((value, fieldId) => {
      enhancedContext[fieldId] = { value, valid: true, required: false };
    });
    
    return this.evaluateExpression(expression, enhancedContext);
  }
}
```

**Pros**:
- Centralized state management
- No React context complexity
- Service-based architecture
- Easy to test and debug

**Cons**:
- Global state in service (potential memory leaks)
- Need to manage service lifecycle
- Less React-like approach

### 3. **Expression Dependency Graph with Topological Sort**

**Approach**: Build a dependency graph of expressions and evaluate them in the correct order.

```typescript
class ExpressionDependencyResolver {
  private dependencyGraph: Map<string, string[]> = new Map();
  private calculatedValues: Map<string, any> = new Map();
  
  addExpression(fieldId: string, dependencies: string[]) {
    this.dependencyGraph.set(fieldId, dependencies);
  }
  
  evaluateAll(formValues: FormContext): Map<string, any> {
    const sortedFields = this.topologicalSort();
    const results = new Map<string, any>();
    
    for (const fieldId of sortedFields) {
      const expression = this.getExpression(fieldId);
      const context = this.buildContext(formValues, results);
      const result = this.evaluate(expression, context);
      results.set(fieldId, result.value);
    }
    
    return results;
  }
  
  private topologicalSort(): string[] {
    // Implement topological sort to determine evaluation order
    // Ensures dependencies are evaluated before dependents
  }
}
```

**Pros**:
- Guarantees correct evaluation order
- Handles complex dependency chains
- No context provider complexity
- Mathematically sound approach

**Cons**:
- More complex implementation
- Need to rebuild dependency graph on changes
- Potential performance overhead

### 4. **Event-Driven Expression Updates**

**Approach**: Use custom events to notify when calculated values change.

```typescript
class ExpressionEventBus {
  private listeners: Map<string, Function[]> = new Map();
  
  subscribe(fieldId: string, callback: Function) {
    if (!this.listeners.has(fieldId)) {
      this.listeners.set(fieldId, []);
    }
    this.listeners.get(fieldId)!.push(callback);
  }
  
  publish(fieldId: string, value: any) {
    const callbacks = this.listeners.get(fieldId) || [];
    callbacks.forEach(callback => callback(value));
  }
}

// In withExpression HOC
useEffect(() => {
  if (expressionResults.value !== null) {
    eventBus.publish(fieldId, expressionResults.value);
  }
}, [expressionResults.value]);

useEffect(() => {
  const unsubscribe = eventBus.subscribe(dependency, (value) => {
    // Re-evaluate expression when dependency changes
    evaluateExpression();
  });
  return unsubscribe;
}, [dependencies]);
```

**Pros**:
- Decoupled architecture
- No context provider complexity
- Easy to add/remove listeners
- Flexible event system

**Cons**:
- Event-driven complexity
- Potential memory leaks if not cleaned up
- Harder to debug event flow
- Not React-like approach

### 5. **Form State with Calculated Values Integration**

**Approach**: Integrate calculated values directly into the form state management.

```typescript
// In FormRenderer or parent component
const [formState, setFormState] = useState({
  values: {},
  calculatedValues: {},
  validation: {},
  // ... other state
});

const updateFormState = (updates: Partial<FormState>) => {
  setFormState(prev => {
    const newState = { ...prev, ...updates };
    
    // Re-evaluate all expressions with new state
    const newCalculatedValues = evaluateAllExpressions(newState);
    
    return {
      ...newState,
      calculatedValues: newCalculatedValues
    };
  });
};
```

**Pros**:
- Single source of truth
- No context provider complexity
- Integrated with form state
- Easy to manage

**Cons**:
- Form state becomes more complex
- Need to re-evaluate all expressions on any change
- Potential performance issues

### 6. **Ref-Based Calculated Values Store**

**Approach**: Use a shared ref object to store calculated values without context.

```typescript
// Shared ref object
const calculatedValuesRef = { current: {} as Record<string, any> };

// In withExpression HOC
const setCalculatedValue = (fieldId: string, value: any) => {
  calculatedValuesRef.current[fieldId] = value;
  // Force re-render of dependent components
  triggerDependentReEvaluation(fieldId);
};

const getCalculatedValue = (fieldId: string) => {
  return calculatedValuesRef.current[fieldId];
};
```

**Pros**:
- Simple implementation
- No context provider complexity
- Direct access to calculated values
- Minimal overhead

**Cons**:
- Global mutable state
- Need manual re-evaluation triggering
- Potential race conditions
- Not React-like approach

## Recommendation

**Best Alternative: Expression Engine Service with Internal State (#2)**

This approach provides:
- ✅ Clean separation of concerns
- ✅ No React context complexity
- ✅ Centralized state management
- ✅ Easy to test and debug
- ✅ Service-based architecture
- ✅ No prop drilling

**Implementation Strategy**:
1. Move calculated value storage into `ExpressionEngineService`
2. Add methods to set/get calculated values
3. Modify `evaluate()` method to merge calculated values into context
4. Update `withExpression` HOC to use service methods instead of context
5. Remove context providers from FormRenderer

**Benefits**:
- Eliminates context provider complexity
- Maintains clean architecture
- Easier to reason about data flow
- Better performance (no context re-renders)
- Simpler testing

This approach maintains the current functionality while eliminating the context provider complexity and providing a more maintainable solution.
