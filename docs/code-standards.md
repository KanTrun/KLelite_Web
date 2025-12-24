# Code Standards

## Naming Conventions

### Files and Directories
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Services | camelCase with `Service` suffix | `authService.ts` |
| Utilities | camelCase | `formatters.ts` |
| Types | camelCase with `.types` suffix | `product.types.ts` |
| Styles | PascalCase with `.module.scss` | `Button.module.scss` |
| Backend controllers | camelCase with `Controller` suffix | `authController.ts` |
| Backend routes | camelCase with `Routes` suffix | `authRoutes.ts` |
| Backend models | PascalCase | `User.ts` |

### Variables and Functions
| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `productList` |
| Constants | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Functions | camelCase | `fetchProducts` |
| React components | PascalCase | `ProductCard` |
| CSS classes | camelCase (in modules) | `styles.cardWrapper` |

## File Organization

### Component Structure
```typescript
// 1. Imports (external, then internal)
import React from 'react';
import { useDispatch } from 'react-redux';
import styles from './Component.module.scss';
import { Button } from '../common/Button';

// 2. Types/Interfaces
interface Props {
  title: string;
  onClick: () => void;
}

// 3. Component
const Component: React.FC<Props> = ({ title, onClick }) => {
  // 4. Hooks
  const dispatch = useDispatch();

  // 5. Handlers
  const handleClick = () => { ... };

  // 6. Render
  return <div className={styles.wrapper}>...</div>;
};

// 7. Export
export default Component;
```

### Backend Controller Pattern
```typescript
// asyncHandler wraps all controllers
export const getProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    data: products
  });
});
```

## TypeScript Patterns

### Interface Definitions
- Define interfaces for all props, API responses, and state
- Use `type` for unions and simple types
- Use `interface` for object shapes that may be extended

### Type Safety
- Avoid `any` type; use `unknown` when type is truly unknown
- Use generics for reusable type patterns
- Define API response types matching backend contracts

## Styling Conventions

### SCSS Modules
- One module per component
- Use global variables for colors, spacing, typography
- Avoid deep nesting (max 3 levels)

### Global Styles
```scss
// Variables in styles/variables.scss
$primary-color: #...;
$spacing-unit: 8px;

// Mixins in styles/mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Responsive Design
- Mobile-first approach
- Breakpoint mixins for consistency
- Flexbox and CSS Grid for layouts

## API Patterns

### Backend Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Frontend API Calls
- Use service layer for API calls
- Handle errors with try/catch or interceptors
- Use React Query for server state when applicable

## Git Conventions

### Commit Messages
Use conventional commits format:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance

### Branch Naming
- `feature/description`
- `fix/description`
- `refactor/description`
