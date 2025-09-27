# Form Flow Editor Synchronization Planning

## Overview
This document outlines the plan to implement bidirectional synchronization between the form flow editor and the main form definition, ensuring that changes made in either interface are reflected in the other.

## Current State Analysis

### Current Architecture
1. **Form Flow Editor** (`FormFlow.tsx`):
   - Uses React Flow to visualize form pages as nodes and connections as edges
   - Generates flow from form definition via `generateFlowFromFormDefinition()`
   - Updates flow state locally with `setNodes()` and `setEdges()`
   - Has node/edge editors for modifying individual components
   - Exports complete form definition via `generateCompleteFormDefinition()`

2. **Main Form Definition**:
   - Stored in `AppStateManager` as `generatedJson` (string) and `parsedJson` (object)
   - Managed through `FormGenerator` component
   - Can be edited via JSON editor or form updates
   - Persisted to IndexedDB via `FormSessionService`

3. **Current Synchronization Issues**:
   - Flow editor changes are not propagated back to main form definition
   - No real-time synchronization between flow and JSON editor
   - Changes in flow editor are lost when switching views
   - No conflict resolution between different editing modes

## Implementation Plan

### Phase 1: Establish Bidirectional Data Flow

#### 1.1 Create Form Synchronization Service
**File**: `apps/prompttoform/src/app/services/form-synchronization.service.ts`

```typescript
interface FormSynchronizationService {
  // Subscribe to form changes from any source
  subscribeToFormChanges(callback: (formDefinition: FormDefinition) => void): () => void;
  
  // Update form from flow editor
  updateFromFlow(nodes: Node[], edges: Edge[], originalForm: FormDefinition): FormDefinition;
  
  // Update form from JSON editor
  updateFromJson(jsonString: string): FormDefinition | null;
  
  // Validate form consistency
  validateFormConsistency(formDefinition: FormDefinition): ValidationResult;
  
  // Handle conflicts between different editing modes
  resolveConflicts(flowForm: FormDefinition, jsonForm: FormDefinition): FormDefinition;
}
```

#### 1.2 Extend AppStateManager
**File**: `apps/prompttoform/src/app/components/molecules/AppStateManager.tsx`

Add new state properties:
```typescript
interface AppState {
  // ... existing properties
  formSynchronizationService: FormSynchronizationService;
  lastModifiedBy: 'flow' | 'json' | 'prompt' | 'import';
  formVersion: number;
  pendingChanges: boolean;
}
```

Add new actions:
```typescript
interface AppStateActions {
  // ... existing actions
  updateFormFromFlow: (nodes: Node[], edges: Edge[]) => void;
  updateFormFromJson: (jsonString: string) => void;
  markFormModified: (source: 'flow' | 'json' | 'prompt' | 'import') => void;
  resolveFormConflicts: () => void;
}
```

### Phase 2: Implement Flow-to-Form Synchronization

#### 2.1 Modify FormFlow Component
**File**: `apps/prompttoform/src/app/components/molecules/FormFlow.tsx`

Key changes:
1. **Remove local state management** for form definition
2. **Add synchronization callbacks** to parent component
3. **Implement real-time updates** when nodes/edges change
4. **Add conflict detection** and resolution

```typescript
interface FormFlowProps {
  formDefinition: LibraryFormDefinition;
  onFormChange: (updatedForm: LibraryFormDefinition) => void;
  onConflictDetected: (conflict: FormConflict) => void;
  readOnly?: boolean;
}

// Replace local form state with props and callbacks
const FormFlow: React.FC<FormFlowProps> = ({ 
  formDefinition, 
  onFormChange, 
  onConflictDetected,
  readOnly = false 
}) => {
  // Remove: const [importedForm, setImportedForm] = useState<any>(null);
  // Remove: const [importedFormName, setImportedFormName] = useState<string>('');
  
  // Add: Real-time synchronization
  const handleNodeChange = useCallback((nodeId: string, pageData: PageProps) => {
    const updatedForm = updateFormDefinition(formDefinition, nodeId, pageData);
    onFormChange(updatedForm);
  }, [formDefinition, onFormChange]);

  const handleEdgeChange = useCallback((edges: Edge[]) => {
    const updatedForm = updateFormConnections(formDefinition, edges);
    onFormChange(updatedForm);
  }, [formDefinition, onFormChange]);
};
```

#### 2.2 Create Form Update Utilities
**File**: `apps/prompttoform/src/app/utils/form-update-utils.ts`

```typescript
export const updateFormDefinition = (
  formDefinition: FormDefinition,
  nodeId: string,
  pageData: PageProps
): FormDefinition => {
  // Update specific page in form definition
  const updatedPages = formDefinition.app.pages.map(page => 
    page.id === nodeId ? { ...page, ...pageData } : page
  );
  
  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages
    }
  };
};

export const updateFormConnections = (
  formDefinition: FormDefinition,
  edges: Edge[]
): FormDefinition => {
  // Update page connections based on edges
  const updatedPages = formDefinition.app.pages.map(page => {
    const pageEdges = edges.filter(edge => edge.source === page.id);
    
    if (pageEdges.length === 0) {
      return { ...page, nextPage: undefined, branches: undefined };
    } else if (pageEdges.length === 1) {
      return { ...page, nextPage: pageEdges[0].target, branches: undefined };
    } else {
      // Multiple edges - convert to branches
      const branches = pageEdges.map(edge => ({
        condition: extractConditionFromEdge(edge),
        nextPage: edge.target
      }));
      return { ...page, nextPage: undefined, branches };
    }
  });
  
  return {
    ...formDefinition,
    app: {
      ...formDefinition.app,
      pages: updatedPages
    }
  };
};
```

### Phase 3: Implement Form-to-Flow Synchronization

#### 3.1 Modify FormGenerator Component
**File**: `apps/prompttoform/src/app/components/molecules/FormGenerator.tsx`

Key changes:
1. **Add form change handler** for flow editor
2. **Implement conflict detection** between JSON and flow edits
3. **Add synchronization status** indicators

```typescript
const FormGenerator: React.FC<FormGeneratorProps> = ({ formJson, triggerDeploy }) => {
  // ... existing state
  
  // Add synchronization state
  const [syncStatus, setSyncStatus] = useState<'synced' | 'conflict' | 'pending'>('synced');
  const [lastModifiedBy, setLastModifiedBy] = useState<'json' | 'flow' | 'prompt'>('prompt');

  // Handle form changes from flow editor
  const handleFormChangeFromFlow = useCallback((updatedForm: FormDefinition) => {
    const jsonString = JSON.stringify(updatedForm, null, 2);
    
    // Check for conflicts with current JSON
    if (lastModifiedBy === 'json' && hasConflicts(parsedJson, updatedForm)) {
      setSyncStatus('conflict');
      // Show conflict resolution dialog
      showConflictResolutionDialog(parsedJson, updatedForm);
    } else {
      // Update form definition
      setGeneratedJson(jsonString);
      setParsedJson(updatedForm);
      setLastModifiedBy('flow');
      setSyncStatus('synced');
    }
  }, [parsedJson, lastModifiedBy]);

  // Handle JSON changes
  const handleJsonChange = useCallback((newJson: string) => {
    setGeneratedJson(newJson);
    setLastModifiedBy('json');
    
    // Validate JSON and update parsed state
    const parsed = parseJsonSafely(newJson);
    if (parsed) {
      setParsedJson(parsed);
      setSyncStatus('synced');
    } else {
      setSyncStatus('pending');
    }
  }, []);

  return (
    <div>
      {/* Add sync status indicator */}
      <div className="sync-status">
        <SyncStatusIndicator status={syncStatus} lastModifiedBy={lastModifiedBy} />
      </div>
      
      {/* Update FormFlow component */}
      {viewMode === 'flow' && parsedJson && (
        <FormFlow 
          formJson={parsedJson}
          onFormChange={handleFormChangeFromFlow}
          onConflictDetected={handleConflictDetected}
        />
      )}
    </div>
  );
};
```

#### 3.2 Create Conflict Resolution Components
**File**: `apps/prompttoform/src/app/components/molecules/ConflictResolutionDialog.tsx`

```typescript
interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (resolution: ConflictResolution) => void;
  conflict: FormConflict;
}

interface FormConflict {
  type: 'page_content' | 'page_connections' | 'form_structure';
  jsonVersion: FormDefinition;
  flowVersion: FormDefinition;
  conflictingFields: string[];
}

interface ConflictResolution {
  strategy: 'use_json' | 'use_flow' | 'merge' | 'manual';
  resolvedForm: FormDefinition;
}
```

### Phase 4: Add Real-time Synchronization Features

#### 4.1 Implement Change Tracking
**File**: `apps/prompttoform/src/app/services/change-tracking.service.ts`

```typescript
interface ChangeTrackingService {
  trackChange(change: FormChange): void;
  getChangeHistory(): FormChange[];
  undoLastChange(): FormDefinition | null;
  redoLastChange(): FormDefinition | null;
  canUndo(): boolean;
  canRedo(): boolean;
}

interface FormChange {
  id: string;
  timestamp: Date;
  type: 'node_update' | 'edge_update' | 'page_add' | 'page_remove' | 'json_edit';
  source: 'flow' | 'json' | 'prompt';
  before: FormDefinition;
  after: FormDefinition;
  description: string;
}
```

#### 4.2 Add Auto-save Functionality
**File**: `apps/prompttoform/src/app/services/auto-save.service.ts`

```typescript
interface AutoSaveService {
  enableAutoSave(intervalMs: number): void;
  disableAutoSave(): void;
  saveNow(): Promise<void>;
  isAutoSaveEnabled(): boolean;
  getLastSaveTime(): Date | null;
}
```

### Phase 5: User Experience Enhancements

#### 5.1 Add Synchronization Status Indicators
**File**: `apps/prompttoform/src/app/components/atoms/SyncStatusIndicator.tsx`

```typescript
interface SyncStatusIndicatorProps {
  status: 'synced' | 'conflict' | 'pending' | 'error';
  lastModifiedBy: 'json' | 'flow' | 'prompt';
  lastSaveTime?: Date;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  status, 
  lastModifiedBy, 
  lastSaveTime 
}) => {
  return (
    <div className="sync-status-indicator">
      <div className={`status-dot ${status}`} />
      <span className="status-text">
        {status === 'synced' && 'All changes synchronized'}
        {status === 'conflict' && 'Conflicts detected - resolution needed'}
        {status === 'pending' && 'Changes pending synchronization'}
        {status === 'error' && 'Synchronization error'}
      </span>
      <span className="last-modified">
        Last modified by: {lastModifiedBy}
      </span>
      {lastSaveTime && (
        <span className="last-save">
          Last saved: {lastSaveTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};
```

#### 5.2 Add Change Notifications
**File**: `apps/prompttoform/src/app/components/molecules/ChangeNotification.tsx`

```typescript
interface ChangeNotificationProps {
  change: FormChange;
  onAccept: () => void;
  onReject: () => void;
  onViewChanges: () => void;
}

const ChangeNotification: React.FC<ChangeNotificationProps> = ({
  change,
  onAccept,
  onReject,
  onViewChanges
}) => {
  return (
    <div className="change-notification">
      <div className="notification-header">
        <h4>Form Updated</h4>
        <span className="timestamp">{change.timestamp.toLocaleTimeString()}</span>
      </div>
      <div className="notification-content">
        <p>{change.description}</p>
        <p>Modified by: {change.source}</p>
      </div>
      <div className="notification-actions">
        <button onClick={onAccept}>Accept Changes</button>
        <button onClick={onReject}>Reject Changes</button>
        <button onClick={onViewChanges}>View Details</button>
      </div>
    </div>
  );
};
```

### Phase 6: Testing and Validation

#### 6.1 Unit Tests
- Test form synchronization service
- Test conflict resolution logic
- Test change tracking functionality
- Test auto-save behavior

#### 6.2 Integration Tests
- Test bidirectional synchronization
- Test conflict scenarios
- Test undo/redo functionality
- Test auto-save integration

#### 6.3 User Acceptance Tests
- Test seamless editing experience
- Test conflict resolution workflow
- Test performance with large forms
- Test data integrity

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Create FormSynchronizationService
- [ ] Extend AppStateManager with sync state
- [ ] Implement basic form update utilities

### Week 3-4: Flow-to-Form Sync ✅ COMPLETED
- [x] Modify FormFlow component
- [x] Implement real-time node/edge updates
- [x] Add form definition generation from flow

### Week 5-6: Form-to-Flow Sync ✅ COMPLETED
- [x] Modify FormGenerator component
- [x] Implement JSON change handling
- [x] Add conflict detection

### Week 7-8: Conflict Resolution
- [ ] Create conflict resolution dialog
- [ ] Implement merge strategies
- [ ] Add manual conflict resolution

### Week 9-10: Advanced Features
- [ ] Implement change tracking
- [ ] Add auto-save functionality
- [ ] Create undo/redo system

### Week 11-12: UX Enhancements
- [ ] Add sync status indicators
- [ ] Implement change notifications
- [ ] Add keyboard shortcuts

### Week 13-14: Testing & Polish
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates

## Risk Mitigation

### Technical Risks
1. **Data Loss**: Implement comprehensive backup and recovery
2. **Performance**: Use debouncing and virtualization for large forms
3. **Conflicts**: Implement robust conflict detection and resolution
4. **State Management**: Use immutable data structures and proper state updates

### User Experience Risks
1. **Confusion**: Provide clear visual feedback and status indicators
2. **Data Loss**: Implement auto-save and change notifications
3. **Complexity**: Keep conflict resolution simple and intuitive
4. **Performance**: Optimize for smooth real-time updates

## Success Metrics

1. **Synchronization Accuracy**: 100% of changes properly synchronized
2. **Conflict Resolution**: <5% of conflicts require manual intervention
3. **Performance**: <100ms response time for form updates
4. **User Satisfaction**: >90% of users report seamless editing experience
5. **Data Integrity**: Zero data loss incidents

## Future Enhancements

1. **Collaborative Editing**: Real-time multi-user editing
2. **Version Control**: Git-like versioning for form definitions
3. **Change History**: Detailed audit trail of all changes
4. **Branching**: Create and merge form definition branches
5. **Templates**: Save and reuse form definition templates
6. **Validation**: Real-time form validation and error checking
7. **Performance**: Web Workers for heavy form processing
8. **Offline Support**: Work offline with sync when reconnected