import { API_URL } from '../config/env';

describe('Configuration', () => {
  it('should have a defined API_URL', () => {
    expect(API_URL).toBeDefined();
    expect(API_URL).toContain('/api');
  });
});
