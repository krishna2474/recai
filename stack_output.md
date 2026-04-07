## UI Pro Max Stack Guidelines
**Stack:** react | **Query:** animation form auth
**Source:** stacks/react.csv | **Found:** 3 results

### Result 1
- **Category:** Context
- **Guideline:** Use context for global data
- **Description:** Context for theme auth locale
- **Do:** Context for app-wide state
- **Don't:** Context for frequently changing data
- **Code Good:** <ThemeContext.Provider>
- **Code Bad:** Context for form field values
- **Severity:** Medium
- **Docs URL:** https://react.dev/learn/passing-data-deeply-with-context

### Result 2
- **Category:** Accessibility
- **Guideline:** Label form controls
- **Description:** Associate labels with inputs
- **Do:** htmlFor matching input id
- **Don't:** Placeholder as only label
- **Code Good:** <label htmlFor="email">Email</label>
- **Code Bad:** <input placeholder="Email"/>
- **Severity:** High
- **Docs URL:** 

### Result 3
- **Category:** State
- **Guideline:** Initialize state lazily
- **Description:** Use function form for expensive initial state
- **Do:** useState(() => computeExpensive())
- **Don't:** useState(computeExpensive())
- **Code Good:** useState(() => JSON.parse(data))
- **Code Bad:** useState(JSON.parse(data))
- **Severity:** Medium
- **Docs URL:** https://react.dev/reference/react/useState#avoiding-recreating-the-initial-state

