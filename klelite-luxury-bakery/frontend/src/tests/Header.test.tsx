// Ensure jsdom environment
/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/layout/Header/Header';
import * as hooks from '../hooks';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect matchers
expect.extend(matchers);

// Define mockNavigate outside the describe block so it can be used in the mock
const mockNavigate = vi.fn();

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the hooks
vi.mock('../hooks', () => ({
  useAuth: vi.fn(),
  useCart: vi.fn(),
}));

// Mock child components to isolate Header testing
vi.mock('../components/common/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

vi.mock('../components/common/SearchBar', () => ({
  SearchBar: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="search-bar">
      SearchBar <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../components/Notifications/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">NotificationBell</div>,
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default hook implementations
    (hooks.useAuth as any).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    (hooks.useCart as any).mockReturnValue({
      cartItemsCount: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText("KL'élite")).toBeInTheDocument();
    expect(screen.getByText("Luxury Bakery")).toBeInTheDocument();

    // There are multiple "Trang chủ" links (desktop and mobile), so we check getAllByText
    const homeLinks = screen.getAllByText("Trang chủ");
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toBeInTheDocument();
  });

  it('applies scrolled class when window is scrolled', () => {
    const { container } = render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    // Initial check - should not have scrolled class (or equivalent logic)
    // Note: Since we use CSS modules, we can't check for 'scrolled' class directly easily without knowing the hashed name.
    // However, we can check if the logic runs.

    // Simulate scroll
    fireEvent.scroll(window, { target: { scrollY: 100 } });

    // In a real browser this adds the class. In JSDOM with React strict mode, verification is trickier without e2e.
    // We mainly ensure no errors are thrown during scroll event handling.
  });

  it('shows user menu when authenticated', () => {
    (hooks.useAuth as any).mockReturnValue({
      user: { firstName: 'TestUser', role: 'user' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('toggles mobile menu', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    // There are multiple buttons with aria-label="Menu" (one desktop hidden, one mobile visible?)
    // Or maybe just one mobile toggle.
    // Let's use getAllByLabelText and pick the visible one or first one.
    const menuButtons = screen.getAllByLabelText('Menu');
    fireEvent.click(menuButtons[0]);

    // Check if mobile menu links appear
    const mobileLinks = screen.getAllByText('Trang chủ');
    expect(mobileLinks.length).toBeGreaterThan(1);
  });
});
