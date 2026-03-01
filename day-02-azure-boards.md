# Day 2: Azure Boards - Work Item Tracking

## What is Azure Boards?

Azure Boards is a work tracking system that supports agile methodologies (Scrum, Kanban, CMMI). It helps teams plan, track, and discuss work.

## Why Use Azure Boards?

- Visual work tracking with Kanban boards
- Sprint planning and backlog management
- Customizable work item types
- Integration with code commits and pull requests
- Real-time collaboration

## How Does It Work?

Work items flow through states:
- New → Active → Resolved → Closed (basic flow)
- Customizable based on process template

## Lab 2: Work Item Management

### Part 1: Create Work Items

1. **Navigate to Boards**
   - Open your `HelloDevOps` project
   - Click "Boards" → "Work items"

2. **Create an Epic**
   - Click "New Work Item" → "Epic"
   - Title: "Build Sample Web Application"
   - Description: "Create a simple web app with CI/CD"
   - Click "Save"

3. **Create Features**
   - Click "New Work Item" → "Feature"
   - Title: "Setup Repository"
   - Link to Epic (Add link → Parent → Select Epic)
   - Save and create another:
     - "Create CI Pipeline"
     - "Create CD Pipeline"

4. **Create User Stories**
   - Under "Setup Repository" feature, create stories:
     - "Initialize Git repository"
     - "Add README and .gitignore"
   - Under "Create CI Pipeline":
     - "Create build pipeline YAML"
     - "Add unit tests"

5. **Create Tasks**
   - Under "Initialize Git repository" story:
     - "Create main branch"
     - "Set branch policies"

### Part 2: Use the Board

1. **Open Kanban Board**
   - Click "Boards" → "Boards"
   - View: Select "Stories"

2. **Move Work Items**
   - Drag a story from "New" to "Active"
   - Drag a task from "To Do" to "Doing"
   - Practice moving items across columns

3. **Customize Board**
   - Click gear icon (Board settings)
   - Add a column: "In Review"
   - Reorder columns
   - Save changes

### Part 3: Backlog Management

1. **Open Backlog**
   - Click "Boards" → "Backlogs"

2. **Prioritize Items**
   - Drag stories to reorder by priority
   - Expand/collapse hierarchy

3. **Add Details**
   - Click a story
   - Add acceptance criteria
   - Estimate effort (Story Points)
   - Assign to yourself

### Verification
- [ ] Created Epic, Features, Stories, and Tasks
- [ ] Work items are linked in hierarchy
- [ ] Moved items on Kanban board
- [ ] Added estimates and assignments

## Key Concepts

- **Epic**: Large body of work (months)
- **Feature**: Deliverable functionality (weeks)
- **User Story**: User-focused requirement (days)
- **Task**: Specific work item (hours)
- **Bug**: Defect to be fixed

## Tips

- Use tags for categorization
- Link work items to show relationships
- Add attachments for context
- Use @mentions for collaboration

## Next Steps
Tomorrow we'll explore Azure Repos and Git version control.
