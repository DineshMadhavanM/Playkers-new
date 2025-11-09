describe('basic math', () => {
  test('adds 1 + 2 = 3', () => {
    expect(1 + 2).toBe(3);
  });

  test('string contains substring', () => {
    expect('playkers booking').toMatch(/booking/);
  });
});
